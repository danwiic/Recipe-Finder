import axios from "axios";
import { db } from "./db.js"
import express from "express";


const app = express();
app.use(express.json())

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
      res.status(200).json({ message: "Login successful" });
    } else {
      res.status(401).json({ error: "Invalid username or password" });
    }
  });
});