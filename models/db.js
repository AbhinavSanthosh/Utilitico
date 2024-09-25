const mysql = require('mysql');
const fs = require('fs');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionLimit: 10,
    ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync('./config/ca.pem'),
    },
});

// Function to test connection using a query
function testConnection() {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('MySQL connection error:', err);
            return;
        }

        console.log('Connected to MySQL!');

        // Example query
        connection.query('SELECT * FROM your_table_name', (err, results) => {
            if (err) {
                console.error('Query error:', err);
            } else {
                console.log('Query results:', results);
            }
            connection.release(); // Release the connection back to the pool
        });
    });
}

testConnection();

module.exports = pool;
