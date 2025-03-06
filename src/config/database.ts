import mysql from "mysql2/promise";

const pool = mysql.createPool({
    host: "192.99.246.129", // Dirección del servidor MySQL
    user: "root", //usuarios configurado en docker-compose
    password: "root_password", // Contraseña configurada en docker-compose
    database: "wha-bot", // Base de datos configurada en docker-compose
    port: 3306, // Puerto de MySQL
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export default pool;