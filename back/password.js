const { randomBytes, scryptSync, timingSafeEqual } = require("node:crypto");

function hashPassword(password) {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    return `scrypt$${salt}$${hash}`;
}

function verificarPassword(password, almacenada) {
    if (typeof almacenada !== "string") return false;
    const partes = almacenada.split("$");
    if (partes.length !== 3 || partes[0] !== "scrypt" || !/^[0-9a-f]{32}$/.test(partes[1]) || !/^[0-9a-f]{128}$/.test(partes[2])) {
        return false;
    }
    const esperada = Buffer.from(partes[2], "hex");
    const recibida = scryptSync(password, partes[1], esperada.length);
    return timingSafeEqual(recibida, esperada);
}

module.exports = { hashPassword, verificarPassword };
