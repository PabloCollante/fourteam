const Database = require("better-sqlite3");
const path = require('path')
const { hashPassword } = require("./password");

const dbPath = process.env.DB_PATH || path.join(__dirname, 'fourteam.db')
const db = new Database(dbPath, {
    // verbose: console.log
});

function InicializarDataBase() {
    //! Tabla Usuarios
    db.exec(
        `CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            roll TEXT DEFAULT 'amigo'
        );
    `);

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
    //! Tabla partidos
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

