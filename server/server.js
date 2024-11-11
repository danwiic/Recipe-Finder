import axios from "axios";
import { db } from "./db.js"
import express from "express";
import cors from 'cors'
import jwt from 'jsonwebtoken'



const app = express();
app.use(express.json())
app.use(cors({
  origin: ['http://192.168.1.185:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}))

app.listen(8800, () => {
    console.log("Server running")
})


const JWT_SECRET = 'super_secret_promise';
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const q = `SELECT * FROM users WHERE username = ? AND password = ?`;

  db.query(q, [username, password], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length > 0) {
      const user = results[0]

      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.status(200).json({ 
        Status: "Success", 
        message: "Login successful",
        user: {
          id: user.user_id,
          username: user.username,
          isLoggedIn: true
        },
        token: token
      });
      console.log(user);
      
    } else {
      res.status(401).json({ error: "Invalid username or password" });
    }
  });
});

app.post("/logout", (req, res) => {
  // Clear the cookie if you are using cookies for session management
  res.clearCookie("accessToken", {
    secure: true,
    sameSite: "none"
  }).status(200).json({
    Status: "Success",
    message: "Logout successful"
  });
});
