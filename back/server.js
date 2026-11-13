const express = require("express");
const cors = require("cors");
const db = require("./database");
const { verificarPassword, hashPassword } = require("./password");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const multer = require("multer");
const sesiones = new Map();
const uploads = path.join(__dirname, "uploads");
fs.mkdirSync(uploads, { recursive: true });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploads, { index: false, fallthrough: false }));

function autenticado(req, res, next) {
    const token = (req.get("authorization") || "").replace(/^Bearer /, "");
    const sesion = sesiones.get(token);
    if (!sesion || sesion.expira < Date.now()) {
        sesiones.delete(token);
        return res.status(401).json({ exito: false, mensaje: "Iniciá sesión para publicar." });
    }
    req.usuarioId = sesion.id;
    const usuario = db.prepare("SELECT debe_cambiar_password FROM usuarios WHERE id = ?").get(sesion.id);
    if (!usuario) { sesiones.delete(token); return res.status(401).json({ exito: false, mensaje: "Iniciá sesión nuevamente." }); }
    if (usuario.debe_cambiar_password && req.path !== "/api/password" && req.path !== "/api/logout") return res.status(403).json({ exito: false, mensaje: "Debés cambiar tu contraseña para continuar." });
    next();
}

app.post("/api/password", autenticado, (req, res) => {
    const { actual, nueva } = req.body || {};
    const usuario = db.prepare("SELECT password FROM usuarios WHERE id = ?").get(req.usuarioId);
    if (typeof actual !== "string" || !usuario || !verificarPassword(actual, usuario.password)) return res.status(400).json({ exito: false, mensaje: "La contraseña actual es incorrecta." });
    if (typeof nueva !== "string" || nueva.length < 8 || nueva.length > 128 || nueva === "123456" || verificarPassword(nueva, usuario.password)) return res.status(400).json({ exito: false, mensaje: "Elegí una contraseña nueva de 8 a 128 caracteres, distinta a la anterior." });
    db.prepare("UPDATE usuarios SET password = ?, debe_cambiar_password = 0 WHERE id = ?").run(hashPassword(nueva), req.usuarioId);
    const tokenActual = req.get("authorization").slice(7);
    for (const [token, sesion] of sesiones) if (sesion.id === req.usuarioId && token !== tokenActual) sesiones.delete(token);
    res.json({ exito: true });
});

function administrador(req, res, next) {
    const usuario = db.prepare("SELECT nombre, roll, password FROM usuarios WHERE id = ?").get(req.usuarioId);
    if (!usuario || !((usuario.nombre === "Pablo" && usuario.roll === "superadmin") || (usuario.nombre === "Leandro" && usuario.roll === "admin"))) return res.status(403).json({ exito: false, mensaje: "Solo los administradores pueden modificar partidos." });
    if (verificarPassword("123456", usuario.password)) return res.status(403).json({ exito: false, mensaje: "Cambiá tu contraseña inicial antes de administrar partidos." });
    next();
}

app.get("/api/partidos", autenticado, (req, res) => {
    const partidos = db.prepare("SELECT id, fecha, rival, goles_fourtem, goles_rival, notas FROM partidos ORDER BY fecha DESC, id DESC").all();
    res.json({ exito: true, partidos });
});
app.get("/api/carrusel", autenticado, (req, res) => {
    res.json({ exito: true, fotos: db.prepare("SELECT posicion, image_url FROM carrusel ORDER BY posicion").all() });
});
app.put("/api/carrusel/:posicion", autenticado, administrador, (req, res) => {
    const posicion = Number(req.params.posicion);
    if (![1, 2, 3].includes(posicion)) return res.status(400).json({ exito: false, mensaje: "Posición de foto inválida." });
    upload.single("imagen")(req, res, (error) => {
        if (error) return res.status(400).json({ exito: false, mensaje: "Elegí una sola imagen de hasta 5 MB." });
        if (!req.file) return res.status(400).json({ exito: false, mensaje: "Elegí una imagen." });
        const b = req.file.buffer;
        const tipo = b.length >= 12 && b.subarray(0, 3).equals(Buffer.from([255, 216, 255])) ? "jpg" :
            b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? "png" :
            b.length >= 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" ? "webp" : null;
        if (!tipo) return res.status(400).json({ exito: false, mensaje: "Elegí una imagen JPG, PNG o WebP válida." });
        const nombre = `${crypto.randomUUID()}.${tipo}`;
        const archivo = path.join(uploads, nombre);
        try {
            fs.writeFileSync(archivo, b, { flag: "wx" });
            db.prepare("INSERT INTO carrusel (posicion, image_url) VALUES (?, ?) ON CONFLICT(posicion) DO UPDATE SET image_url = excluded.image_url").run(posicion, `/uploads/${nombre}`);
            res.json({ exito: true });
        } catch (err) {
            if (fs.existsSync(archivo)) fs.unlinkSync(archivo);
            res.status(500).json({ exito: false, mensaje: "No se pudo guardar la foto del carrusel." });
        }
    });
});
function datosPartido(req, res, next) {
    const { fecha, rival, goles_fourtem, goles_rival, notas = "" } = req.body || {};
    const validaFecha = typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha) && !Number.isNaN(Date.parse(`${fecha}T00:00:00Z`)) && new Date(`${fecha}T00:00:00Z`).toISOString().startsWith(fecha);
    if (!validaFecha || typeof rival !== "string" || !rival.trim() || rival.trim().length > 80 || !Number.isInteger(goles_fourtem) || goles_fourtem < 0 || goles_fourtem > 999 || !Number.isInteger(goles_rival) || goles_rival < 0 || goles_rival > 999 || typeof notas !== "string" || notas.length > 1000) return res.status(400).json({ exito: false, mensaje: "Revisá la fecha, el rival, los goles y las notas." });
    req.partido = { fecha, rival: rival.trim(), goles_fourtem, goles_rival, notas: notas.trim() };
    next();
}
app.post("/api/partidos", autenticado, administrador, datosPartido, (req, res) => {
    const { fecha, rival, goles_fourtem, goles_rival, notas } = req.partido;
    const resultado = db.prepare("INSERT INTO partidos (fecha, rival, goles_fourtem, goles_rival, notas) VALUES (?, ?, ?, ?, ?)").run(fecha, rival, goles_fourtem, goles_rival, notas);
    res.status(201).json({ exito: true, id: resultado.lastInsertRowid });
});
app.put("/api/partidos/:id", autenticado, administrador, datosPartido, (req, res) => {
    const { fecha, rival, goles_fourtem, goles_rival, notas } = req.partido;
    const resultado = db.prepare("UPDATE partidos SET fecha = ?, rival = ?, goles_fourtem = ?, goles_rival = ?, notas = ? WHERE id = ?").run(fecha, rival, goles_fourtem, goles_rival, notas, req.params.id);
    res.status(resultado.changes ? 200 : 404).json({ exito: !!resultado.changes, mensaje: resultado.changes ? undefined : "Partido no encontrado." });
});
app.delete("/api/partidos/:id", autenticado, administrador, (req, res) => {
    const resultado = db.prepare("DELETE FROM partidos WHERE id = ?").run(req.params.id);
    res.status(resultado.changes ? 200 : 404).json({ exito: !!resultado.changes, mensaje: resultado.changes ? undefined : "Partido no encontrado." });
});

app.get("/api/posts", autenticado, (req, res) => {
    const posts = db.prepare(`SELECT post.id, post.usuario_id, post.descripcion, post.image_url, post.fecha_publicacion, usuarios.nombre
        FROM post JOIN usuarios ON usuarios.id = post.usuario_id ORDER BY post.id DESC`).all();
    res.json({ exito: true, posts });
});
app.get("/api/posts/:id/comentarios", autenticado, (req, res) => {
    if (!db.prepare("SELECT id FROM post WHERE id = ?").get(req.params.id)) return res.status(404).json({ exito: false, mensaje: "La publicación ya no existe." });
    const comentarios = db.prepare(`SELECT comentarios.id, comentarios.usuario_id, comentarios.texto, comentarios.fecha, usuarios.nombre
        FROM comentarios JOIN usuarios ON usuarios.id = comentarios.usuario_id
        WHERE post_id = ? ORDER BY comentarios.id`).all(req.params.id);
    res.json({ exito: true, comentarios });
});
app.post("/api/posts/:id/comentarios", autenticado, (req, res) => {
    const texto = req.body?.texto;
    if (typeof texto !== "string" || !texto.trim() || texto.trim().length > 1000) return res.status(400).json({ exito: false, mensaje: "Escribí un comentario de hasta 1000 caracteres." });
    if (!db.prepare("SELECT id FROM post WHERE id = ?").get(req.params.id)) return res.status(404).json({ exito: false, mensaje: "La publicación ya no existe." });
    db.prepare("INSERT INTO comentarios (post_id, usuario_id, texto) VALUES (?, ?, ?)").run(req.params.id, req.usuarioId, texto.trim());
    res.status(201).json({ exito: true });
});
app.post("/api/posts", autenticado, (req, res) => {
    upload.single("imagen")(req, res, (error) => {
        if (error) return res.status(400).json({ exito: false, mensaje: "La imagen debe pesar hasta 5 MB." });
        const descripcion = typeof req.body?.descripcion === "string" ? req.body.descripcion.trim() : "";
        if (descripcion.length > 2000 || (!descripcion && !req.file)) return res.status(400).json({ exito: false, mensaje: "Escribí un texto o elegí una imagen (máximo 2000 caracteres)." });
        let imageUrl = "";
        let archivo;
        if (req.file) {
            const b = req.file.buffer;
            const tipo = b.length >= 12 && b.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) ? "jpg" :
                b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ? "png" :
                b.length >= 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" ? "webp" : null;
            if (!tipo) return res.status(400).json({ exito: false, mensaje: "Elegí una imagen JPG, PNG o WebP válida." });
            const nombre = `${crypto.randomUUID()}.${tipo}`;
            archivo = path.join(uploads, nombre);
            imageUrl = `/uploads/${nombre}`;
        }
        try {
            if (archivo) fs.writeFileSync(archivo, req.file.buffer, { flag: "wx" });
            db.prepare("INSERT INTO post (usuario_id, image_url, descripcion) VALUES (?, ?, ?)").run(req.usuarioId, imageUrl, descripcion);
            res.status(201).json({ exito: true });
        } catch (err) {
            if (archivo && fs.existsSync(archivo)) fs.unlinkSync(archivo);
            res.status(500).json({ exito: false, mensaje: "No se pudo guardar la publicación." });
        }
    });
});
app.post("/api/logout", autenticado, (req, res) => {
    sesiones.delete(req.get("authorization").slice(7));
    res.json({ exito: true });
});

app.get("/api/perfiles/:id", autenticado, (req, res) => {
    const perfil = db.prepare("SELECT id, nombre, apodo, foto_url FROM usuarios WHERE id = ?").get(req.params.id);
    if (!perfil) return res.status(404).json({ exito: false, mensaje: "No se encontró el perfil." });
    const posts = db.prepare("SELECT id, usuario_id, descripcion, image_url, fecha_publicacion FROM post WHERE usuario_id = ? ORDER BY id DESC").all(perfil.id);
    res.json({ exito: true, perfil, posts });
});

app.patch("/api/perfil", autenticado, (req, res) => {
    upload.single("foto")(req, res, (error) => {
        if (error) return res.status(400).json({ exito: false, mensaje: "La foto debe pesar hasta 5 MB." });
        const apodo = typeof req.body?.apodo === "string" ? req.body.apodo.trim() : "";
        if (apodo.length > 40) return res.status(400).json({ exito: false, mensaje: "El apodo puede tener hasta 40 caracteres." });
        let foto = db.prepare("SELECT foto_url FROM usuarios WHERE id = ?").get(req.usuarioId).foto_url;
        let archivo;
        if (req.file) {
            const b = req.file.buffer;
            const tipo = b.length >= 12 && b.subarray(0, 3).equals(Buffer.from([255, 216, 255])) ? "jpg" :
                b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? "png" :
                b.length >= 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" ? "webp" : null;
            if (!tipo) return res.status(400).json({ exito: false, mensaje: "Elegí una imagen JPG, PNG o WebP válida." });
            const nombre = `${crypto.randomUUID()}.${tipo}`;
            archivo = path.join(uploads, nombre);
            foto = `/uploads/${nombre}`;
        }
        try {
            if (archivo) fs.writeFileSync(archivo, req.file.buffer, { flag: "wx" });
            db.prepare("UPDATE usuarios SET apodo = ?, foto_url = ? WHERE id = ?").run(apodo, foto, req.usuarioId);
            res.json({ exito: true });
        } catch (err) {
            if (archivo && fs.existsSync(archivo)) fs.unlinkSync(archivo);
            res.status(500).json({ exito: false, mensaje: "No se pudo guardar el perfil." });
        }
    });
});

app.get("/api/equipo", autenticado, (req, res) => {
    try {
        const equipo = db.prepare("SELECT id, nombre, roll, apodo, foto_url FROM usuarios").all();
        res.json({ exito: true, equipo });
    } catch (error) {
        res.status(500).json({ exito: false, mensaje: "Error al leer la base de datos" });
    }
});

app.post("/api/login", (req, res) => {
    const { nombre, password } = req.body || {};
    if (typeof nombre !== "string" || typeof password !== "string" || !nombre.trim() || !password) {
        return res.status(400).json({ exito: false, mensaje: "Usuario y contraseña requeridos" });
    }

    try {
        const usuario = db.prepare("SELECT id, nombre, password, roll, debe_cambiar_password FROM usuarios WHERE nombre = ?").get(nombre.trim());
        if (!usuario || !verificarPassword(password, usuario.password)) {
            return res.status(401).json({ exito: false, mensaje: "Usuario o contraseña incorrectos" });
        }

        const token = crypto.randomBytes(32).toString("hex");
        sesiones.set(token, { id: usuario.id, expira: Date.now() + 24 * 60 * 60 * 1000 });
        // El rol siempre sale de la base de datos; cualquier campo enviado por el cliente se ignora.
        return res.json({
            exito: true,
            token,
            requiere_cambio: !!usuario.debe_cambiar_password,
            usuario: { id: usuario.id, nombre: usuario.nombre, roll: usuario.roll }
        });
    } catch (error) {
        return res.status(500).json({ exito: false, mensaje: "Error al iniciar sesión" });
    }
});

app.get("/", (req, res) => {
    res.send("⚽ Servidor de Fourteam funcionando");
});

if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port, (error) => {
        if (error) {
            console.error(error.code === "EADDRINUSE"
                ? `El puerto ${port} ya está ocupado. Cerrá el otro servidor y volvé a intentar.`
                : `No se pudo iniciar el backend: ${error.message}`);
            process.exitCode = 1;
            return;
        }
        console.log(`🚀 Servidor backend corriendo en http://localhost:${port}`);
    });
}

module.exports = app;
