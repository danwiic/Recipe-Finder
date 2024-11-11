import axios from "axios";
import { db } from "./db.js"
import express from "express";
import cors from 'cors'

const app = express();
app.use(express.json())
app.use(cors({
  origin: ['http://192.168.1.185:5173', 'https://find-meal-recipe.netlify.app/'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

app.listen(8800, () => {
    console.log("Server running")
})

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const q = `SELECT * FROM users WHERE username = ? AND password = ?`;

  db.query(q, [username, password], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length > 0) {
      res.status(200).json({ Status: "Success", message: "Login successful" });
    } else {
      res.status(401).json({ error: "Invalid username or password" });
    }
  });
});