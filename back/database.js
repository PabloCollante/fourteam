const Database = require("better-sqlite3");
const path = require('path')
const { hashPassword } = require("./password");

const dbPath = process.env.DB_PATH || path.join(__dirname, 'fourteam.db')
const db = new Database(dbPath, {
    // verbose: console.log
});

function InicializarDataBase() {
    db.exec("CREATE TABLE IF NOT EXISTS carrusel (posicion INTEGER PRIMARY KEY CHECK(posicion BETWEEN 1 AND 3), image_url TEXT NOT NULL)");
    //! Tabla Usuarios
    db.exec(
        `CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            roll TEXT DEFAULT 'amigo'
        );
    `);
    const columnasUsuario = db.pragma("table_info(usuarios)").map((columna) => columna.name);
    if (!columnasUsuario.includes("apodo")) db.exec("ALTER TABLE usuarios ADD COLUMN apodo TEXT NOT NULL DEFAULT ''");
    if (!columnasUsuario.includes("foto_url")) db.exec("ALTER TABLE usuarios ADD COLUMN foto_url TEXT NOT NULL DEFAULT ''");
    if (!columnasUsuario.includes("debe_cambiar_password")) db.exec("ALTER TABLE usuarios ADD COLUMN debe_cambiar_password INTEGER NOT NULL DEFAULT 1");

    //! Tabla Post
    db.exec(`
        CREATE TABLE IF NOT EXISTS post (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            image_url TEXT NOT NULL,
            descripcion TEXT NOT NULL,
            fecha_publicacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        );
    `);
    // Corrige bases antiguas que apuntaban a la tabla inexistente "usuario".
    if (db.pragma("foreign_key_list(post)").some((fk) => fk.from === "usuario_id" && fk.table === "usuario")) {
        const objetos = db.prepare("SELECT sql FROM sqlite_master WHERE tbl_name = 'post' AND type IN ('index', 'trigger') AND sql IS NOT NULL").all();
        db.pragma("foreign_keys = OFF");
        try {
            db.transaction(() => {
                db.exec(`CREATE TABLE post_migracion (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    usuario_id INTEGER NOT NULL,
                    image_url TEXT NOT NULL,
                    descripcion TEXT NOT NULL,
                    fecha_publicacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
                );
                INSERT INTO post_migracion (id, usuario_id, image_url, descripcion, fecha_publicacion)
                    SELECT id, usuario_id, image_url, descripcion, fecha_publicacion FROM post;
                DROP TABLE post;
                ALTER TABLE post_migracion RENAME TO post;`);
                for (const objeto of objetos) db.exec(objeto.sql);
            })();
        } finally {
            db.pragma("foreign_keys = ON");
        }
    }
    //! Tabla partidos
    db.exec(`CREATE TABLE IF NOT EXISTS comentarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL REFERENCES post(id) ON DELETE CASCADE,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
        texto TEXT NOT NULL,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.exec("CREATE INDEX IF NOT EXISTS comentarios_post_id ON comentarios(post_id, id)");
    db.exec(`
        CREATE TABLE IF NOT EXISTS partidos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha TEXT NOT NULL,
            rival TEXT NOT NULL, 
            goles_fourtem INTEGER DEFAULT 0,
            goles_rival INTEGER DEFAULT 0,
            resultados TEXT CHECK(resultados IN ('Victoria', 'Empate', 'Derrota')),
            figura_id INTEGER,
            notas TEXT,
            FOREIGN KEY (figura_id) REFERENCES usuarios(id)
        ); 
    `);
    if (db.pragma("foreign_key_list(partidos)").some((fk) => fk.from === "figura_id" && fk.table === "usuario")) {
        const objetos = db.prepare("SELECT sql FROM sqlite_master WHERE tbl_name = 'partidos' AND type IN ('index', 'trigger') AND sql IS NOT NULL").all();
        db.pragma("foreign_keys = OFF");
        try {
            db.transaction(() => {
                db.exec(`CREATE TABLE partidos_migracion (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, fecha TEXT NOT NULL, rival TEXT NOT NULL,
                    goles_fourtem INTEGER DEFAULT 0, goles_rival INTEGER DEFAULT 0,
                    resultados TEXT CHECK(resultados IN ('Victoria', 'Empate', 'Derrota')),
                    figura_id INTEGER, notas TEXT, FOREIGN KEY (figura_id) REFERENCES usuarios(id)
                );
                INSERT INTO partidos_migracion (id, fecha, rival, goles_fourtem, goles_rival, resultados, figura_id, notas)
                    SELECT id, fecha, rival, goles_fourtem, goles_rival, resultados, figura_id, notas FROM partidos;
                DROP TABLE partidos;
                ALTER TABLE partidos_migracion RENAME TO partidos;`);
                for (const objeto of objetos) db.exec(objeto.sql);
            })();
        } finally { db.pragma("foreign_keys = ON"); }
    }

    const count = db.prepare(`SELECT COUNT(*) as total FROM usuarios`).get()
    if (count.total === 0) {
        console.log(`Tabla de usuario vacia, creando equipo`)

        const insertUser = db.prepare(`INSERT INTO usuarios (nombre, password) VALUES (?, ?)`);
        const contraseniaTemporal = process.env.INITIAL_PASSWORD || `123456`

        const crearEquiupo = db.transaction((amigos) => {
            for (const amigo of amigos) {
                insertUser.run(amigo, hashPassword(contraseniaTemporal))
            }
        });

        crearEquiupo(['Pablo', 'Leandro', 'Cazorla', 'Enzo', 'Lazaro', 'Mauro', 'Lazarte', 'Licha']);
        console.log(`Usuarios creados con exito`);
    }
    db.exec("CREATE TABLE IF NOT EXISTS migraciones (nombre TEXT PRIMARY KEY)");
    if (!db.prepare("SELECT 1 FROM migraciones WHERE nombre = ?").get("roles_partidos")) {
        db.transaction(() => {
            db.prepare("UPDATE usuarios SET roll = ? WHERE nombre = ?").run("superadmin", "Pablo");
            db.prepare("UPDATE usuarios SET roll = ? WHERE nombre = ?").run("admin", "Leandro");
            db.prepare("INSERT INTO migraciones (nombre) VALUES (?)").run("roles_partidos");
        })();
    }
    // Migra contraseñas antiguas guardadas en texto plano sin cambiarlas.
    const usuariosAntiguos = db.prepare("SELECT id, password FROM usuarios WHERE password NOT LIKE 'scrypt$%'").all();
    const actualizarPassword = db.prepare("UPDATE usuarios SET password = ? WHERE id = ?");
    db.transaction(() => {
        for (const usuario of usuariosAntiguos) {
            actualizarPassword.run(hashPassword(usuario.password), usuario.id);
        }
    })();
    console.log("Base de datos lsita")
}
//se ejecuta bien inica el programa
InicializarDataBase();
//exportacion de la db
module.exports = db;

