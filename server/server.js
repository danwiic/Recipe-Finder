import axios from "axios";
import { db } from "./db.js"
import express from "express";
import cors from 'cors'
import jwt from 'jsonwebtoken'

const PORT = 8800

const app = express();
app.use(express.json())


app.use(cors({
  origin: ['http://192.168.1.185:5173', 'http://localhost:5173', 'https://find-meal-recipe.netlify.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin'],
  credentials: true
}))

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
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

app.post('/meals', (req, res) => {
  const { strMeal, strCategory, strArea, strInstructions, strMealThumb, strTags, strYoutube, ingredients, measurements, user_id } = req.body;


  // Insert the new meal into the database
  const query = `INSERT INTO meals (strMeal, strCategory, strArea, strInstructions, strMealThumb, strTags, strYoutube, ingredients, measurements, user_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(query, [
      strMeal,
      strCategory,
      strArea,
      strInstructions,
      strMealThumb,
      strTags,
      strYoutube,
      JSON.stringify(ingredients), // Convert ingredients to JSON string
      JSON.stringify(measurements), // Convert measurements to JSON string
      user_id,
  ], (err, result) => {
      if (err) {
          return res.status(500).json({ message: 'Error inserting meal data', error: err });
      }

      res.status(201).json({ message: 'Meal successfully added', mealId: result.insertId });
  });
});

app.get('/meal', (req, res) => {
  const { search } = req.query; // Get search query from request

  // If no search term is provided, return all meals
  if (!search) {
    db.query('SELECT * FROM meals', (err, results) => {
      if (err) {
          return res.status(500).json({ message: "Error fetching meals", error: err });
      }

      // Format the response to match the MealDB structure
      const formattedMeals = results.map(meal => {
          const ingredients = JSON.parse(meal.ingredients); // Assuming it's stored as JSON
          const measurements = JSON.parse(meal.measurements); // Assuming it's stored as JSON
          
          const formattedIngredients = {};
          const formattedMeasurements = {};

          for (let i = 1; i <= 20; i++) {
              formattedIngredients[`strIngredient${i}`] = ingredients[`ingredient${i}`] || null;
              formattedMeasurements[`strMeasure${i}`] = measurements[`measurement${i}`] || null;
          }

          return {
              idMeal: meal.idMeal,
              strMeal: meal.strMeal,
              strCategory: meal.strCategory,
              strArea: meal.strArea,
              strInstructions: meal.strInstructions,
              strMealThumb: meal.strMealThumb,
              strTags: meal.strTags,
              strYoutube: meal.strYoutube,
              ...formattedIngredients,
              ...formattedMeasurements,
              user_id: meal.user_id,
              created_at: meal.created_at
          };
      });

      res.json({ meals: formattedMeals });
    });
  } else {
    // If a search term is provided, filter meals by name
    db.query('SELECT * FROM meals WHERE strMeal LIKE ?', [`%${search}%`], (err, results) => {
      if (err) {
          return res.status(500).json({ message: "Error fetching meals", error: err });
      }

      // Format the response to match the MealDB structure
      const formattedMeals = results.map(meal => {
          const ingredients = JSON.parse(meal.ingredients); // Assuming it's stored as JSON
          const measurements = JSON.parse(meal.measurements); // Assuming it's stored as JSON
          
          const formattedIngredients = {};
          const formattedMeasurements = {};

          for (let i = 1; i <= 20; i++) {
              formattedIngredients[`strIngredient${i}`] = ingredients[`ingredient${i}`] || null;
              formattedMeasurements[`strMeasure${i}`] = measurements[`measurement${i}`] || null;
          }

          return {
              idMeal: meal.idMeal,
              strMeal: meal.strMeal,
              strCategory: meal.strCategory,
              strArea: meal.strArea,
              strInstructions: meal.strInstructions,
              strMealThumb: meal.strMealThumb,
              strTags: meal.strTags,
              strYoutube: meal.strYoutube,
              ...formattedIngredients,
              ...formattedMeasurements,
              user_id: meal.user_id,
              created_at: meal.created_at
          };
      });

      res.json({ meals: formattedMeals });
    });
  }
});

app.post('/search', (req, res) => {
  const { search } = req.body; // Get search term from the request body

  if (!search) {
      return res.status(400).json({ message: "Search term is required" });
  }

  // Query the database or call the MealDB API
  db.query('SELECT * FROM meals WHERE strMeal LIKE ?', [`%${search}%`], (err, results) => {
      if (err) {
          return res.status(500).json({ message: "Error fetching meals", error: err });
      }

      // Format the response to match the MealDB structure
      const formattedMeals = results.map(meal => {
          const ingredients = JSON.parse(meal.ingredients); // Assuming it's stored as JSON
          const measurements = JSON.parse(meal.measurements); // Assuming it's stored as JSON
          
          const formattedIngredients = {};
          const formattedMeasurements = {};

          for (let i = 1; i <= 20; i++) {
              formattedIngredients[`strIngredient${i}`] = ingredients[`ingredient${i}`] || null;
              formattedMeasurements[`strMeasure${i}`] = measurements[`measurement${i}`] || null;
          }

          return {
              idMeal: meal.idMeal,
              strMeal: meal.strMeal,
              strCategory: meal.strCategory,
              strArea: meal.strArea,
              strInstructions: meal.strInstructions,
              strMealThumb: meal.strMealThumb,
              strTags: meal.strTags,
              strYoutube: meal.strYoutube,
              ...formattedIngredients,
              ...formattedMeasurements,
              user_id: meal.user_id,
              created_at: meal.created_at
          };
      });

      res.json({ meals: formattedMeals });
  });
});

