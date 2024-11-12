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
  credentials: true,
}));

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
      JSON.stringify(ingredients),
      JSON.stringify(measurements),
      user_id,
  ], (err, result) => {
      if (err) {
          return res.status(500).json({ message: 'Error inserting meal data', error: err });
      }

      res.status(201).json({ message: 'Meal successfully added', mealId: result.insertId });
  });
});

app.get('/meal', (req, res) => {
  const search = req.query.search;

  if (!search) {
      return res.status(400).json({ message: "Search term is required" });
  }

  db.query('SELECT * FROM meals WHERE strMeal LIKE ?', [`%${search}%`], (err, results) => {
      if (err) {
          return res.status(500).json({ message: "Error fetching meals", error: err });
      }

      const formattedMeals = results.map(meal => {
          const ingredients = JSON.parse(meal.ingredients);
          const measurements = JSON.parse(meal.measurements);
          
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

app.get('/meal/:id', (req, res) => {
  const mealId = req.params.id;

  const query = 'SELECT * FROM meals WHERE idMeal = ?';
  db.query(query, [mealId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'Meal not found!' });
    }

    const meal = result[0];
    if (meal) {
      const ingredients = meal.ingredients ? JSON.parse(meal.ingredients) : [];
      const measurements = meal.measurements ? JSON.parse(meal.measurements) : [];

      const formattedIngredients = {};
      const formattedMeasurements = {};

      for (let i = 1; i <= 20; i++) {
        formattedIngredients[`strIngredient${i}`] = ingredients[`ingredient${i}`] || null;
        formattedMeasurements[`strMeasure${i}`] = measurements[`measurement${i}`] || null;
      }

      return res.json({
        meal: {
          idMeal: meal.idMeal,
          strMeal: meal.strMeal,
          strCategory: meal.strCategory,
          strArea: meal.strArea,
          strInstructions: meal.strInstructions,
          strMealThumb: meal.strMealThumb,
          strTags: meal.strTags,
          strYoutube: meal.strYoutube,
          user_id: meal.user_id,
          created_at: meal.created_at,
          ...formattedIngredients,
          ...formattedMeasurements
        }
      });
    } else {
      return res.status(400).json({ message: 'Meal data is incomplete or malformed' });
    }
  });
});

// Add meal to favorites
app.post('/favorites', (req, res) => {
  const { idMeal, user_id } = req.body;

  // Check if the meal is already in favorites
  db.query('SELECT * FROM favorites WHERE user_id = ? AND idMeal = ?', [user_id, idMeal], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: "Meal already added to favorites" });
    }

    // If not added, insert the new favorite
    db.query('INSERT INTO favorites (user_id, idMeal) VALUES (?, ?)', [user_id, idMeal], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error adding to favorites', error: err });
      }

      res.status(201).json({ message: 'Meal added to favorites' });
    });
  });
});

// Fetch the meals that are added to favorites by the user
app.get('/favorites/:user_id', async (req, res) => {
  const { user_id } = req.params;

  // Get the list of idMeal for the user's favorites
  db.query('SELECT idMeal FROM favorites WHERE user_id = ?', [user_id], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "No favorite meals found" });
    }

    // Fetch meal details from TheMealDB API for each idMeal
    try {
      const mealPromises = results.map(async (fav) => {
        const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${fav.idMeal}`);
        return response.data.meals[0]; // Return the first meal
      });

      const meals = await Promise.all(mealPromises);

      res.status(200).json({ meals });
    } catch (error) {
      return res.status(500).json({ message: "Error fetching meal details", error: error });
    }
  });
});




// Remove meal from favorites
app.post('/favorites/remove', (req, res) => {
  const { idMeal, user_id } = req.body;

  // Remove the meal from the favorites table
  db.query('DELETE FROM favorites WHERE user_id = ? AND idMeal = ?', [user_id, idMeal], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error removing from favorites", error: err });
    }

    // Get the updated favorite count
    db.query('SELECT COUNT(*) AS favorite_count FROM favorites WHERE idMeal = ?', [idMeal], (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching favorite count", error: err });
      }

      const favoriteCount = result[0].favorite_count;

      res.status(200).json({
        message: 'Meal removed from favorites',
        favoriteCount: favoriteCount // Return the updated favorite count
      });
    });
  });
});





// Get the number of users who added a specific meal to their favorites
app.get('/favorites/count/:idMeal', (req, res) => {
  const idMeal = req.params.idMeal;

  // Query to count the number of users who added the meal to their favorites
  const query = 'SELECT COUNT(*) AS favoritesCount FROM favorites WHERE idMeal = ?';
  
  db.query(query, [idMeal], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }

    // Return the count of users who favorited the meal
    const favoritesCount = result[0].favoritesCount;
    res.status(200).json({ idMeal, favoritesCount });
  });
});

