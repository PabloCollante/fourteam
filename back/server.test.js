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

        assert.equal((await fetch(`${base}/api/equipo`)).status, 401);

        const login = (datos) => fetch(`${base}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });

        const faltante = await login({ nombre: "Pablo" });
        assert.equal(faltante.status, 400);

        const incorrecto = await login({ nombre: "Pablo", password: "incorrecta" });
        assert.equal(incorrecto.status, 401);
        for (const nombre of ["Pablo", "Leandro", "Cazorla", "Enzo", "Lazaro", "Mauro", "Lazarte", "Licha"]) {
            const primero = await (await login({ nombre, password: "123456" })).json();
            assert.equal(primero.requiere_cambio, true);
            assert.equal((await fetch(`${base}/api/partidos`, { headers: { Authorization: `Bearer ${primero.token}` } })).status, 403);
        }

        const manipulado = await login({ nombre: "Pablo", password: "123456", roll: "admin" });
        assert.equal(manipulado.status, 200);
        const resultado = await manipulado.json();
        assert.equal(resultado.usuario.roll, "superadmin");
        assert.equal("password" in resultado.usuario, false);
        assert.equal(resultado.requiere_cambio, true);
        const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });
        assert.equal((await fetch(`${base}/api/equipo`, auth(resultado.token))).status, 403);
        const partido = { fecha: "2026-11-10", rival: "Rival", goles_fourtem: 2, goles_rival: 1, notas: "Buen partido" };
        const solicitud = (token, metodo, ruta, cuerpo) => fetch(`${base}${ruta}`, { method: metodo, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "application/json" }, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
        assert.equal((await solicitud(null, "POST", "/api/partidos", partido)).status, 401);
        const amigo = await (await login({ nombre: "Cazorla", password: "123456", roll: "admin" })).json();
        assert.equal(amigo.usuario.roll, "amigo");
        assert.equal(amigo.requiere_cambio, true);
        assert.equal((await solicitud(amigo.token, "POST", "/api/partidos", partido)).status, 403);
        assert.equal((await solicitud(amigo.token, "POST", "/api/password", { actual: "123456", nueva: "clave-cazorla" })).status, 200);
        db.prepare("UPDATE usuarios SET roll = 'admin' WHERE nombre = 'Cazorla'").run();
        assert.equal((await solicitud(amigo.token, "POST", "/api/partidos", partido)).status, 403);
        assert.equal((await solicitud(resultado.token, "POST", "/api/partidos", partido)).status, 403);
        assert.equal((await solicitud(resultado.token, "POST", "/api/password", { actual: "123456", nueva: "12345678" })).status, 200);
        assert.equal(db.prepare("SELECT debe_cambiar_password FROM usuarios WHERE id = ?").get(resultado.usuario.id).debe_cambiar_password, 0);
        assert.equal(require("./password").verificarPassword("123456", db.prepare("SELECT password FROM usuarios WHERE id = ?").get(resultado.usuario.id).password), false);
        assert.equal((await login({ nombre: "Pablo", password: "123456" })).status, 401);
        assert.equal((await solicitud(resultado.token, "POST", "/api/password", { actual: "12345678", nueva: "12345678" })).status, 400);
        const loginNuevo = await (await login({ nombre: "Pablo", password: "12345678" })).json();
        assert.equal(loginNuevo.requiere_cambio, false);
        const equipoResponse = await fetch(`${base}/api/equipo`, auth(resultado.token));
        assert.equal(equipoResponse.status, 200);
        const equipo = await equipoResponse.json();
        assert.equal(equipo.equipo.length, 8);
        assert.equal(equipo.equipo[0].roll, "superadmin");
        assert.equal("password" in equipo.equipo[0], false);
        assert.equal((await solicitud(resultado.token, "POST", "/api/partidos", { ...partido, goles_fourtem: -1 })).status, 400);
        const creado = await solicitud(resultado.token, "POST", "/api/partidos", partido);
        assert.equal(creado.status, 201);
        const partidoId = (await creado.json()).id;
        const leandro = await (await login({ nombre: "Leandro", password: "123456" })).json();
        assert.equal(leandro.usuario.roll, "admin");
        assert.equal((await solicitud(leandro.token, "PUT", `/api/partidos/${partidoId}`, partido)).status, 403);
        assert.equal((await solicitud(leandro.token, "POST", "/api/password", { actual: "123456", nueva: "clave-leandro-segura" })).status, 200);
        assert.equal((await solicitud(leandro.token, "PUT", `/api/partidos/${partidoId}`, { ...partido, goles_rival: 3 })).status, 200);
        assert.equal((await (await fetch(`${base}/api/partidos`, auth(resultado.token))).json()).partidos[0].goles_rival, 3);
        assert.equal((await solicitud(amigo.token, "DELETE", `/api/partidos/${partidoId}`)).status, 403);
        assert.equal((await solicitud(leandro.token, "DELETE", `/api/partidos/${partidoId}`)).status, 200);
        const fotoCarrusel = () => {
            const form = new FormData();
            form.set("imagen", new Blob([fs.readFileSync(path.join(__dirname, "../front/src/assets/images/foto 1.webp"))], { type: "image/webp" }), "foto.webp");
            return form;
        };
        const cambiarCarrusel = (token, posicion, form) => fetch(`${base}/api/carrusel/${posicion}`, { method: "PUT", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
        assert.equal((await cambiarCarrusel(null, 1, fotoCarrusel())).status, 401);
        assert.equal((await cambiarCarrusel(amigo.token, 1, fotoCarrusel())).status, 403);
        assert.equal((await cambiarCarrusel(resultado.token, 4, fotoCarrusel())).status, 400);
        assert.equal((await cambiarCarrusel(resultado.token, 1, new FormData())).status, 400);
        const falsa = new FormData();
        falsa.set("imagen", new Blob(["texto"], { type: "image/png" }), "falsa.png");
        assert.equal((await cambiarCarrusel(resultado.token, 1, falsa)).status, 400);
        assert.equal((await cambiarCarrusel(resultado.token, 1, fotoCarrusel())).status, 200);
        assert.equal((await cambiarCarrusel(leandro.token, 2, fotoCarrusel())).status, 200);
        const carrusel = await (await fetch(`${base}/api/carrusel`, auth(resultado.token))).json();
        assert.equal(carrusel.fotos.length, 2);
        for (const foto of carrusel.fotos) {
            assert.equal((await fetch(`${base}${foto.image_url}`)).status, 200);
            fs.unlinkSync(path.join(__dirname, foto.image_url));
        }
        const perfilForm = new FormData();
        perfilForm.set("apodo", "Capitán");
        perfilForm.set("id", "2");
        assert.equal((await fetch(`${base}/api/perfil`, { method: "PATCH", body: perfilForm })).status, 401);
        assert.equal((await fetch(`${base}/api/perfil`, { method: "PATCH", headers: { Authorization: `Bearer ${resultado.token}` }, body: perfilForm })).status, 200);
        assert.equal((await (await fetch(`${base}/api/perfiles/1`, auth(resultado.token))).json()).perfil.apodo, "Capitán");
        assert.equal((await (await fetch(`${base}/api/perfiles/2`, auth(resultado.token))).json()).perfil.apodo, "");
        const perfilFoto = new FormData();
        perfilFoto.set("apodo", "Capitán");
        perfilFoto.set("foto", new Blob([fs.readFileSync(path.join(__dirname, "../front/src/assets/images/foto 1.webp"))], { type: "image/webp" }), "foto.webp");
        assert.equal((await fetch(`${base}/api/perfil`, { method: "PATCH", headers: { Authorization: `Bearer ${resultado.token}` }, body: perfilFoto })).status, 200);
        const fotoPerfil = (await (await fetch(`${base}/api/perfiles/1`, auth(resultado.token))).json()).perfil.foto_url;
        assert.equal((await fetch(`${base}${fotoPerfil}`)).status, 200);
        fs.unlinkSync(path.join(__dirname, fotoPerfil));

        const sinSesion = await fetch(`${base}/api/posts`, { method: "POST", body: new FormData() });
        assert.equal(sinSesion.status, 401);
        const soloTexto = new FormData();
        soloTexto.set("descripcion", "Publicación sin foto");
        const respuestaTexto = await fetch(`${base}/api/posts`, { method: "POST", headers: { Authorization: `Bearer ${resultado.token}` }, body: soloTexto });
        assert.equal(respuestaTexto.status, 201);
        const form = new FormData();
        form.set("descripcion", "Un momento del equipo");
        form.set("imagen", new Blob([fs.readFileSync(path.join(__dirname, "../front/src/assets/images/foto 1.webp"))], { type: "image/webp" }), "foto.webp");
        const post = await fetch(`${base}/api/posts`, { method: "POST", headers: { Authorization: `Bearer ${resultado.token}` }, body: form });
        assert.equal(post.status, 201);
        const listado = await (await fetch(`${base}/api/posts`, auth(resultado.token))).json();
        assert.equal(listado.posts[0].nombre, "Pablo");
        assert.equal(listado.posts[0].descripcion, "Un momento del equipo");
        const rutaComentarios = `/api/posts/${listado.posts[0].id}/comentarios`;
        assert.equal((await solicitud(null, "POST", rutaComentarios, { texto: "Sin sesión" })).status, 401);
        assert.equal((await solicitud(resultado.token, "POST", rutaComentarios, { texto: "   " })).status, 400);
        assert.equal((await solicitud(resultado.token, "POST", rutaComentarios, { texto: "x".repeat(1001) })).status, 400);
        assert.equal((await solicitud(resultado.token, "POST", "/api/posts/999999/comentarios", { texto: "No existe" })).status, 404);
        assert.equal((await solicitud(resultado.token, "POST", rutaComentarios, { texto: "Buen recuerdo", usuario_id: 2 })).status, 201);
        const comentarios = await (await fetch(`${base}${rutaComentarios}`, auth(resultado.token))).json();
        assert.equal(comentarios.comentarios[0].texto, "Buen recuerdo");
        assert.equal(comentarios.comentarios[0].usuario_id, resultado.usuario.id);
        assert.equal(comentarios.comentarios[0].nombre, "Pablo");
        assert.equal((await fetch(`${base}${listado.posts[0].image_url}`)).status, 200);
        fs.unlinkSync(path.join(__dirname, listado.posts[0].image_url));
        const invalido = new FormData();
        invalido.set("imagen", new Blob(["no es imagen"], { type: "image/png" }), "falsa.png");
        assert.equal((await fetch(`${base}/api/posts`, { method: "POST", headers: { Authorization: `Bearer ${resultado.token}` }, body: invalido })).status, 400);
        await fetch(`${base}/api/logout`, { method: "POST", headers: { Authorization: `Bearer ${resultado.token}` } });
        assert.equal((await fetch(`${base}/api/posts`, { method: "POST", headers: { Authorization: `Bearer ${resultado.token}` }, body: soloTexto })).status, 401);

        const cambio = await fetch(`${base}/api/equipo/${resultado.usuario.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roll: "admin" })
        });
        assert.equal(cambio.status, 404);
        assert.equal(db.prepare("SELECT roll FROM usuarios WHERE id = ?").get(resultado.usuario.id).roll, "superadmin");
        assert.match(db.prepare("SELECT password FROM usuarios WHERE id = ?").get(resultado.usuario.id).password, /^scrypt\$/);
    } finally {
        await new Promise((resolve, reject) => servidor.close((error) => error ? reject(error) : resolve()));
        db.close();
        fs.rmSync(directorio, { recursive: true, force: true });
    }
});
