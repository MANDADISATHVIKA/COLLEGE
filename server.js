const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "sathvika@2005", // Change if needed
    database: "clg",
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        process.exit(1); // Exit process on database connection failure
    } else {
        console.log("Connected to MySQL database");
    }
});

// Login API
app.post("/login", (req, res) => {
    const { email, password, role } = req.body;
    const table = role === "student" ? "students" : "teachers";

    const query = `SELECT * FROM ${table} WHERE email = ? AND password = ?`;
    db.query(query, [email, password], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        if (results.length > 0) {
            res.json({ user: results[0] });
        } else {
            res.status(401).json({ error: "Invalid email or password" });
        }
    });
});

// Student Dashboard API
app.get("/student/:id", (req, res) => {
    const studentId = req.params.id;

    const query = `
        SELECT s.*, 
            (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = 'Present') AS attendance_count,
            (SELECT GROUP_CONCAT(CONCAT(subject, ': ', marks_obtained, '/', total_marks) SEPARATOR ', ') 
             FROM marks WHERE student_id = s.id) AS marks
        FROM students s
        WHERE s.id = ?`;

    db.query(query, [studentId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).json({ error: "Student not found" });
        }
    });
});

// Teacher Dashboard API
app.get("/teacher/:id", (req, res) => {
    const teacherId = req.params.id;

    const query = `
        SELECT t.*, 
            (SELECT GROUP_CONCAT(CONCAT(day, ' ', start_time, '-', end_time, ' (', subject, ') in ', classroom) SEPARATOR ', ') 
             FROM timetable WHERE teacher_id = t.id) AS schedule
        FROM teachers t
        WHERE t.id = ?`;

    db.query(query, [teacherId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).json({ error: "Teacher not found" });
        }
    });
});

// Insert Marks API
app.post("/marks", (req, res) => {
    const { teacher_id, student_id, subject, marks_obtained, total_marks } =
    req.body;

    const query = `INSERT INTO marks(student_id, subject, marks_obtained, total_marks) VALUES(?, ?, ?, ?)`;
    db.query(query, [student_id, subject, marks_obtained, total_marks], (err) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json({ message: "Marks added successfully" });
    });
});

// Insert Attendance API
app.post("/attendance", (req, res) => {
    const { teacher_id, student_id, status } = req.body;

    const query = `INSERT INTO attendance(student_id, date, status) VALUES(?, CURDATE(), ?)`;
    db.query(query, [student_id, status], (err) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json({ message: "Attendance marked successfully" });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});