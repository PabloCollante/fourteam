const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Database = require("better-sqlite3");

test("migra contraseñas existentes en texto plano", () => {
    const directorio = fs.mkdtempSync(path.join(os.tmpdir(), "fourteam-migration-"));
    const archivo = path.join(directorio, "legacy.db");
    const anterior = new Database(archivo);
    anterior.exec("CREATE TABLE usuarios (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL UNIQUE, password TEXT NOT NULL, roll TEXT DEFAULT 'amigo')");
    anterior.prepare("INSERT INTO usuarios (nombre, password, roll) VALUES (?, ?, ?)").run("Pablo", "clave-anterior", "amigo");
    anterior.exec("CREATE TABLE post (id INTEGER PRIMARY KEY AUTOINCREMENT, usuario_id INTEGER NOT NULL, image_url TEXT NOT NULL, descripcion TEXT NOT NULL, fecha_publicacion DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (usuario_id) REFERENCES usuario(id))");
    anterior.pragma("foreign_keys = OFF");
    anterior.prepare("INSERT INTO post (usuario_id, image_url, descripcion) VALUES (?, ?, ?)").run(1, "", "Publicación anterior");
    anterior.exec("CREATE TABLE partidos (id INTEGER PRIMARY KEY AUTOINCREMENT, fecha TEXT NOT NULL, rival TEXT NOT NULL, goles_fourtem INTEGER DEFAULT 0, goles_rival INTEGER DEFAULT 0, resultados TEXT, figura_id INTEGER, notas TEXT, FOREIGN KEY (figura_id) REFERENCES usuario(id))");
    anterior.prepare("INSERT INTO partidos (fecha, rival, figura_id) VALUES (?, ?, ?)").run("2026-01-01", "Rival anterior", 1);
    anterior.close();

    process.env.DB_PATH = archivo;
    const db = require("./database");
    try {
        const usuario = db.prepare("SELECT password, roll FROM usuarios WHERE nombre = ?").get("Pablo");
        assert.match(usuario.password, /^scrypt\$/);
        assert.equal(usuario.roll, "superadmin");
        assert.equal(require("./password").verificarPassword("clave-anterior", usuario.password), true);
        assert.equal(db.pragma("foreign_key_list(post)")[0].table, "usuarios");
        assert.equal(db.prepare("SELECT descripcion FROM post WHERE id = 1").get().descripcion, "Publicación anterior");
        db.prepare("INSERT INTO post (usuario_id, image_url, descripcion) VALUES (?, ?, ?)").run(1, "", "Nueva publicación");
        assert.equal(db.pragma("foreign_key_list(partidos)")[0].table, "usuarios");
        assert.equal(db.prepare("SELECT rival FROM partidos WHERE id = 1").get().rival, "Rival anterior");
        db.prepare("INSERT INTO partidos (fecha, rival) VALUES (?, ?)").run("2026-01-02", "Nuevo rival");
    } finally {
        db.close();
        fs.rmSync(directorio, { recursive: true, force: true });
    }
});
