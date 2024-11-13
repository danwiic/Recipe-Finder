import axios from "axios";
import { db } from "./db.js"
import express from "express";
import cors from 'cors'
import jwt from 'jsonwebtoken'

const PORT = 8800
const app = express();
app.use(express.json())

app.use(cors({
  origin: ['http://192.168.1.185:5173', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin'],
  credentials: true,
}));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

// CREATE ACCOUNT
app.post("/signup", (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Password did not match" });
  }

  // Check if the username or email already exists
  const checkQuery = `SELECT * FROM users WHERE username = ? OR email = ?`;
  db.query(checkQuery, [username, email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length > 0) {
      if (results[0].username === username) {
        return res.status(400).json({ message: "Username is already used" });
      }
      if (results[0].email === email) {
        return res.status(400).json({ message: "Email is already used" });
      }
    }

    // Insert the new user into the database without password hashing
    const insertQuery = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
    db.query(insertQuery, [username, email, password], (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error creating user" });
      }

      res.status(201).json({ message: "User created successfully" });
    });
  });
});

const JWT_SECRET = 'super_secret_promise';
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const q = `SELECT * FROM users WHERE username = ?`;

  db.query(q, [username], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length > 0) {
      const user = results[0];

      // Check if the password matches (no hashing here)
      if (user.password === password) {
        const token = jwt.sign(
          { id: user.id, username: user.username },
          JWT_SECRET,
          { expiresIn: '1h' }
        );

        return res.status(200).json({
          Status: "Success",
          message: "Login successful",
          user: {
            id: user.user_id,
            username: user.username,
            isLoggedIn: true
          },
          token: token
        });
      } else {
        // Incorrect password
        return res.status(404).json({ error: "Invalid username or password" });
      }
    } else {
      return res.status(401).json({ error: "Invalid username or password" });
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

// Add meal
app.post('/meals', (req, res) => {
  const { strMeal, strCategory, strArea, strInstructions, strMealThumb, strTags, strYoutube, ingredients, measurements, user_id } = req.body;

  console.log("Received data:", req.body);
  // Convert ingredients and measurements arrays to JSON strings
  const ingredientsJSON = JSON.stringify(ingredients);
  const measurementsJSON = JSON.stringify(measurements);

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
      ingredientsJSON,
      measurementsJSON,
      user_id,
  ], (err, result) => {
      if (err) {
          return res.status(500).json({ message: 'Error inserting meal data', error: err });
      }

      res.status(201).json({ message: 'Meal successfully added', mealId: result.insertId });
  });
});

// Search meals
app.get('/meal', async (req, res) => {
  const search = req.query.search;

  if (!search) {
    return res.status(400).json({ message: "Search term is required" });
  }

  // Query your database for meals based on the search term
  db.query('SELECT * FROM meals WHERE strMeal LIKE ?', [`%${search}%`], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching meals", error: err });
    }

    const formattedMeals = [];
    
    // Loop through each meal in the results
    for (const meal of results) {
      let ingredients = [];
      let measurements = [];

      try {
        // Handle ingredients: try to parse as JSON or split as CSV
        if (meal.ingredients) {
          try {
            ingredients = JSON.parse(meal.ingredients);  // Attempt to parse as JSON
          } catch (e) {
            ingredients = meal.ingredients.split(',');  // Fall back to CSV format if JSON parsing fails
          }
        }
        
        // Handle measurements: try to parse as JSON or split as CSV
        if (meal.measurements) {
          try {
            measurements = JSON.parse(meal.measurements);  // Attempt to parse as JSON
          } catch (e) {
            measurements = meal.measurements.split(',');  // Fall back to CSV format if JSON parsing fails
          }
        }
      } catch (error) {
        console.error('Error processing ingredients or measurements:', error);
      }

      const formattedIngredients = {};
      const formattedMeasurements = {};

      // Ensure we have 20 ingredients and measurements
      for (let i = 1; i <= 20; i++) {
        formattedIngredients[`strIngredient${i}`] = ingredients[i - 1] || null;  // Use null if not available
        formattedMeasurements[`strMeasure${i}`] = measurements[i - 1] || null;  // Use null if not available
      }

      // Check if the meal exists in TheMealDB API
      try {
        const { data } = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`);

        // If the meal exists in TheMealDB API, skip adding it to the result
        if (data.meals && data.meals.length > 0) {
          continue;  // Skip this meal if it exists in TheMealDB API
        }
      } catch (error) {
        console.error('Error checking TheMealDB API:', error);
      }

      // If the meal is not found in TheMealDB, add it to the formatted meals
      formattedMeals.push({
        idMeal: String(meal.idMeal),  // Ensure idMeal is always a string
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
      });
    }

    res.json({ meals: formattedMeals });
  });
});


// search meal by idMeal
app.get('/meal/:id', (req, res) => {
  const mealId = req.params.id;

  // Query to fetch meal by ID
  const query = `SELECT * FROM meals WHERE idMeal = ?`;

  db.query(query, [mealId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database query error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    const meal = results[0]; // Get the first (and likely only) result

    // Check if ingredients and measurements exist, if not, set to empty array
    let ingredients = [];
    let measurements = [];

    try {
      if (meal.ingredients) {
        // Attempt to parse ingredients as JSON or split by commas if parsing fails
        try {
          ingredients = JSON.parse(meal.ingredients);
        } catch (e) {
          ingredients = meal.ingredients.split(',');  // Fall back to CSV format
        }
      }

      if (meal.measurements) {
        // Attempt to parse measurements as JSON or split by commas if parsing fails
        try {
          measurements = JSON.parse(meal.measurements);
        } catch (e) {
          measurements = meal.measurements.split(',');  // Fall back to CSV format
        }
      }
    } catch (error) {
      console.error('Error parsing ingredients or measurements:', error);
    }

    // Prepare the response data
    const response = {
      idMeal: String(meal.idMeal),  // Ensure idMeal is a string
      strMeal: meal.strMeal,
      strCategory: meal.strCategory,
      strArea: meal.strArea,
      strInstructions: meal.strInstructions,
      strMealThumb: meal.strMealThumb,
      strTags: meal.strTags,
      strYoutube: meal.strYoutube,
      ingredients: ingredients,
      measurements: measurements
    };

    // Send the response as JSON
    res.json(response);
  });
});


// Add meal to favorites
app.post('/favorites/add', async (req, res) => {
  const { idMeal, user_id } = req.body;

  // Check if the meal already exists in the meals table
  db.query('SELECT * FROM meals WHERE idMeal = ?', [idMeal], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }

    if (results.length === 0) {
      // Meal does not exist, fetch meal details from TheMealDB API
      try {
        const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${idMeal}`);
        const mealDetails = response.data.meals[0];

        // Log the meal details from the API for debugging
        console.log("Meal details from API:", mealDetails);

        // Extract ingredients and measurements
        const ingredients = [];
        const measurements = [];
        for (let i = 1; i <= 20; i++) {
          const ingredientKey = `strIngredient${i}`;
          const measureKey = `strMeasure${i}`;

          const ingredient = mealDetails[ingredientKey];
          const measurement = mealDetails[measureKey];

          // Check if ingredient and measurement are valid and non-empty
          if (ingredient && ingredient.trim()) {
            ingredients.push(ingredient.trim());
          }
          if (measurement && measurement.trim()) {
            measurements.push(measurement.trim());
          }
        }

        // Log the ingredients and measurements to check
        console.log("Extracted Ingredients:", ingredients);
        console.log("Extracted Measurements:", measurements);

        // Check if ingredients and measurements are populated
        const ingredientsJson = ingredients.length > 0 ? JSON.stringify(ingredients) : null;
        const measurementsJson = measurements.length > 0 ? JSON.stringify(measurements) : null;

        // Log the formatted data before insertion
        console.log("Formatted Ingredients JSON:", ingredientsJson);
        console.log("Formatted Measurements JSON:", measurementsJson);

        // Insert meal into the meals table
        const query = `INSERT INTO meals (idMeal, strMeal, strCategory, strArea, strInstructions, strMealThumb, strTags, strYoutube, ingredients, measurements)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.query(query, [
          mealDetails.idMeal,
          mealDetails.strMeal,
          mealDetails.strCategory,
          mealDetails.strArea,
          mealDetails.strInstructions,
          mealDetails.strMealThumb,
          mealDetails.strTags,
          mealDetails.strYoutube,
          ingredientsJson,
          measurementsJson
        ], (err, result) => {
          if (err) {
            console.error("Error inserting meal data:", err);
            return res.status(500).json({ message: 'Error inserting meal data', error: err });
          }

          // After the meal is added to the meals table, now add it to favorites
          db.query('INSERT INTO favorites (user_id, idMeal) VALUES (?, ?)', [user_id, idMeal], (err, result) => {
            if (err) {
              console.error("Error adding to favorites:", err);
              return res.status(500).json({ message: 'Error adding to favorites', error: err });
            }

            res.status(201).json({ message: 'Meal added to favorites' });
          });
        });
      } catch (error) {
        console.error("Error fetching meal details from TheMealDB:", error);
        return res.status(500).json({ message: "Error fetching meal details from TheMealDB", error: error });
      }
    } else {
      // If the meal already exists in the meals table, just add to favorites
      db.query('INSERT INTO favorites (user_id, idMeal) VALUES (?, ?)', [user_id, idMeal], (err, result) => {
        if (err) {
          console.error("Error adding to favorites:", err);
          return res.status(500).json({ message: 'Error adding to favorites', error: err });
        }

        res.status(201).json({ message: 'Meal added to favorites' });
      });
    }
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

    try {
      const mealPromises = results.map(async (fav) => {
        // Try to get meal details from your custom API using the new /meal/:id endpoint
        const mealFromCustomAPI = await axios.get(`http://192.168.1.185:8800/meal/${fav.idMeal}`).then(response => response.data ? response.data : null);

        // If meal is not found, try fetching from TheMealDB API
        const mealFromTheMealDB = mealFromCustomAPI ? null : await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${fav.idMeal}`).then(response => response.data.meals ? response.data.meals[0] : null);

        // Return meal from custom API if available, otherwise return from TheMealDB API
        return mealFromCustomAPI || mealFromTheMealDB;
      });

      const meals = (await Promise.all(mealPromises)).filter(Boolean); // Filter out null values if not found in either API

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

// RATING A MEAL
app.post('/rate', (req, res) => {
  const { meal_id, user_id, rating } = req.body;

  if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
  }

  // Check if the user has already rated this meal
  const checkQuery = 'SELECT * FROM ratings WHERE meal_id = ? AND user_id = ?';
  
  db.query(checkQuery, [meal_id, user_id], (err, results) => {
      if (err) {
          return res.status(500).json({ message: 'Error checking existing rating', error: err });
      }

      if (results.length > 0) {
          // If a rating exists, update it
          const updateQuery = 'UPDATE ratings SET rating = ? WHERE meal_id = ? AND user_id = ?';
          
          db.query(updateQuery, [rating, meal_id, user_id], (err, result) => {
              if (err) {
                  return res.status(500).json({ message: 'Error updating rating', error: err });
              }

              res.status(200).json({ message: 'Rating updated successfully' });
          });
      } else {
          // If no existing rating, insert a new one
          const insertQuery = 'INSERT INTO ratings (meal_id, user_id, rating) VALUES (?, ?, ?)';
          
          db.query(insertQuery, [meal_id, user_id, rating], (err, result) => {
              if (err) {
                  return res.status(500).json({ message: 'Error submitting rating', error: err });
              }

              res.status(201).json({ message: 'Rating submitted successfully' });
          });
      }
  });
});


// RATING PER MEAL
app.get('/ratings/average/:meal_id', (req, res) => {
  const { meal_id } = req.params;

  const query = `
    SELECT AVG(rating) AS averageRating, COUNT(rating) AS ratingCount
    FROM ratings
    WHERE meal_id = ?`;

  db.query(query, [meal_id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching rating info', error: err });
    }

    const averageRating = results[0].averageRating || 0;
    const ratingCount = results[0].ratingCount || 0;
    res.status(200).json({ averageRating, ratingCount });
  });
});


// COUNT TOTAL REVIEW A MEAL HAS
app.get('/meal/:idMeal/ratings/count', (req, res) => {
  const { idMeal } = req.params;

  // SQL query to count ratings for the given meal ID
  db.query(
    'SELECT COUNT(*) AS ratingCount FROM ratings WHERE meal_id = ?',
    [idMeal],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching rating count", error: err });
      }

      const ratingCount = result[0].ratingCount;
      res.status(200).json({
        message: `Meal has been rated by ${ratingCount} users`,
        ratingCount: ratingCount
      });
    }
  );
});
