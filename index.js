const mysql = require('mysql');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionLimit: 10,
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('MySQL connection error:', err);
    } else {
        console.log('Connected to MySQL');
        connection.query('SELECT 1', (err, results) => {
            if (err) {
                console.error('Query error:', err);
            } else {
                console.log('Query results:', results);
            }
            connection.release();
        });
    }
});
