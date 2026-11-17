
const express = require('express');
const pool = require('./config/db');
const noticeRoutes = require('./routes/noticeRoutes');

require('dotenv').config();

const app = express();

app.use(express.json());
app.use('/api/notices', noticeRoutes);

app.get('/', (req, res) => {
    res.send('Campus Notice Management System API is running!');
});

app.get('/api/health', async (req, res) => {
    try {
        const [result] = await pool.query('SELECT 1 AS connected');

        res.json({
            success: true,
            message: 'Backend connected to MySQL successfully!',
            database: 'campus_notice_db',
            result: result[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Database connection failed'
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
