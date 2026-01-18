const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname))); // Serve static files from current directory

// Database Connection
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'aya_academy'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Create table if not exists (for convenience)
const createTableQuery = `
    CREATE TABLE IF NOT EXISTS registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        children_count INT NOT NULL,
        stage VARCHAR(50) NOT NULL,
        subjects TEXT,
        whatsapp VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`;

db.query(createTableQuery, (err) => {
    if (err) console.error('Error creating table:', err);
    else console.log('Registrations table ready');
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.post('/save_data', (req, res) => {
    const { children_count, stage, subjects, whatsapp } = req.body;

    // Convert subjects array to string
    const subjectsString = Array.isArray(subjects) ? subjects.join(', ') : subjects;

    const query = 'INSERT INTO registrations (children_count, stage, subjects, whatsapp) VALUES (?, ?, ?, ?)';

    db.query(query, [children_count, stage, subjectsString, whatsapp], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            res.status(500).json({ message: 'Database error', error: err });
        } else {
            res.status(200).json({ message: 'Registration successful', id: result.insertId });
        }
    });
});

// Route to view registrations
app.get('/registrations', (req, res) => {
    const query = 'SELECT * FROM registrations ORDER BY created_at DESC';
    db.query(query, (err, results) => {
        if (err) {
            res.status(500).send('Error fetching data');
            return;
        }

        let html = `
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <title>بيانات المسجلين</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb; }
                    table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                    th, td { padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; }
                    th { background-color: #10b981; color: white; }
                    tr:hover { background-color: #f3f4f6; }
                    h1 { color: #065f46; }
                </style>
            </head>
            <body>
                <h1>بيانات الطلاب المسجلين</h1>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>عدد الأولاد</th>
                            <th>المرحلة</th>
                            <th>المواد</th>
                            <th>الواتس آب</th>
                            <th>تاريخ التسجيل</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        results.forEach(row => {
            html += `
                <tr>
                    <td>${row.id}</td>
                    <td>${row.children_count}</td>
                    <td>${row.stage}</td>
                    <td>${row.subjects}</td>
                    <td>${row.whatsapp}</td>
                    <td>${new Date(row.created_at).toLocaleString('ar-EG')}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </body>
            </html>
        `;

        res.send(html);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
