console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_DATABASE:', process.env.DB_DATABASE);


const pool = require('./config/mysql');

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to MySQL!');
        await connection.release();
    } catch (error) {
        console.error('MySQL connection error:', error);
    }
}

testConnection();
