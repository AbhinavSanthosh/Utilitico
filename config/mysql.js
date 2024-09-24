const mysql = require('mysql2/promise'); // Ensure you're using the promise version
const fs = require('fs');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: true, // This ensures that the server certificate is validated
        ca: fs.readFileSync('config/ca.pem'), // Path to your CA certificate
    },
});


module.exports = pool;
