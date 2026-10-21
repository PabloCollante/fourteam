const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const directorio = fs.mkdtempSync(path.join(os.tmpdir(), "fourteam-test-"));
process.env.DB_PATH = path.join(directorio, "test.db");
process.env.INITIAL_PASSWORD = "123456";

const app = require("./server");
const db = require("./database");

test("endpoints y rol protegido contra peticiones manipuladas", async () => {
    const servidor = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => servidor.once("listening", resolve));
    const base = `http://127.0.0.1:${servidor.address().port}`;

    try {
        const inicio = await fetch(base);
        assert.equal(inicio.status, 200);

        const equipoResponse = await fetch(`${base}/api/equipo`);
        assert.equal(equipoResponse.status, 200);
        const equipo = await equipoResponse.json();
        assert.equal(equipo.exito, true);
        assert.equal(equipo.equipo.length, 8);
        assert.equal(equipo.equipo[0].roll, "amigo");
        assert.equal("password" in equipo.equipo[0], false);

        const login = (datos) => fetch(`${base}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });

        const faltante = await login({ nombre: "Pablo" });
        assert.equal(faltante.status, 400);

        const incorrecto = await login({ nombre: "Pablo", password: "incorrecta" });
        assert.equal(incorrecto.status, 401);

        const manipulado = await login({ nombre: "Pablo", password: "123456", roll: "admin" });
        assert.equal(manipulado.status, 200);
        const resultado = await manipulado.json();
        assert.equal(resultado.usuario.roll, "amigo");
        assert.equal("password" in resultado.usuario, false);

        const cambio = await fetch(`${base}/api/equipo/${resultado.usuario.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roll: "admin" })
        });
        assert.equal(cambio.status, 404);
        assert.equal(db.prepare("SELECT roll FROM usuarios WHERE id = ?").get(resultado.usuario.id).roll, "amigo");
        assert.match(db.prepare("SELECT password FROM usuarios WHERE id = ?").get(resultado.usuario.id).password, /^scrypt\$/);
    } finally {
        await new Promise((resolve, reject) => servidor.close((error) => error ? reject(error) : resolve()));
        db.close();
        fs.rmSync(directorio, { recursive: true, force: true });
    }
});
