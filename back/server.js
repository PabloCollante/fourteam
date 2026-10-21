const express = require("express");
const cors = require("cors");
const db = require("./database");
const { verificarPassword } = require("./password");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/equipo", (req, res) => {
    try {
        const equipo = db.prepare("SELECT id, nombre, roll FROM usuarios").all();
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
        const usuario = db.prepare("SELECT id, nombre, password, roll FROM usuarios WHERE nombre = ?").get(nombre.trim());
        if (!usuario || !verificarPassword(password, usuario.password)) {
            return res.status(401).json({ exito: false, mensaje: "Usuario o contraseña incorrectos" });
        }

        // El rol siempre sale de la base de datos; cualquier campo enviado por el cliente se ignora.
        return res.json({
            exito: true,
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
    app.listen(port, () => {
        console.log(`🚀 Servidor backend corriendo en http://localhost:${port}`);
    });
}

module.exports = app;
