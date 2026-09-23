const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

//? Middlewares
app.use(cors());
app.use(express.json())

//? Rutas
//* Ruta de prueba
app.get("/api/equipo", (req, res) => {
    try {
        const usuarios = db.prepare(`SELECT id, nombre, roll FROM usuarios`).all
        res.json({ exito: true, equipo: usuarios });
    } catch (error) {
        res.status(500).json({ exito: false, mensaje: `Error al leer la base de datos` })
    }
});

//* Ruta por defecto
app.get(`/ `, (req, res) => {
    req.send("⚽ Servidor de Fourteam funcionando al 100%")
});

//! Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`)
})
