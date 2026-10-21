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
    anterior.close();

    process.env.DB_PATH = archivo;
    const db = require("./database");
    try {
        const usuario = db.prepare("SELECT password, roll FROM usuarios WHERE nombre = ?").get("Pablo");
        assert.match(usuario.password, /^scrypt\$/);
        assert.equal(usuario.roll, "amigo");
        assert.equal(require("./password").verificarPassword("clave-anterior", usuario.password), true);
    } finally {
        db.close();
        fs.rmSync(directorio, { recursive: true, force: true });
    }
});
