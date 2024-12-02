import axios from "axios";
import { db } from "./db.js"
import express from "express";
import cors from 'cors'
import jwt from 'jsonwebtoken'
import SibApiV3Sdk from 'sib-api-v3-sdk';
import dotenv from "dotenv"

dotenv.config()

const PORT = 8800
const app = express();
app.use(express.json())
const brevo = new SibApiV3Sdk.TransactionalEmailsApi();
SibApiV3Sdk.ApiClient.instance.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

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

  // Validate password match
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  // Validate password length
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters long" });
  }

  // Check if username or email already exists
  const checkQuery = `SELECT * FROM users WHERE username = ? OR email = ?`;
  db.query(checkQuery, [username, email], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    // If username or email already exists
    if (results.length > 0) {
      if (results.some(user => user.username === username)) {
        return res.status(400).json({ message: "Username is already taken" });
      }
      if (results.some(user => user.email === email)) {
        return res.status(400).json({ message: "Email is already in use" });
      }
    }

    // Insert new user into the database
    const insertQuery = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
    db.query(insertQuery, [username, email, password], (err, result) => {
      if (err) {
        console.error("Error inserting user:", err);
        return res.status(500).json({ message: "Error creating user" });
      }

      // Success response
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
            isLoggedIn: true,
            role: user.role
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
  const { 
    strMeal, 
    category_id, 
    strArea, 
    strInstructions, 
    strMealThumb,
    strYoutube, 
    ingredients, 
    user_id 
  } = req.body;

  // Validate required fields
  if (!strMeal || !category_id || !ingredients || ingredients.length === 0 || !user_id) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  // Format ingredients as JSON
  const formattedIngredients = JSON.stringify(ingredients.map(item => item.trim()));

  // Check or insert the category
  db.query(
    'SELECT id FROM categories WHERE category_name = ?',
    [category_id],
    (err, existingCategory) => {
      if (err) {
        console.error("Error checking category:", err);
        return res.status(500).json({ message: 'Error checking category', error: err });
      }

      const categoryId = existingCategory.length > 0
        ? existingCategory[0].id
        : (function() {
            return new Promise((resolve, reject) => {
              db.query(
                'INSERT INTO categories (category_name) VALUES (?)',
                [category_id],
                (err, result) => {
                  if (err) reject(err);
                  else resolve(result.insertId);
                }
              );
            });
          })();

      categoryId.then(async (categoryId) => {
        // Insert the meal
        db.query(
          `INSERT INTO meals (strMeal, category_id, strArea, strInstructions, strMealThumb, strYoutube, ingredients, user_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            strMeal,
            categoryId,
            strArea,
            strInstructions,
            strMealThumb,
            strYoutube,
            formattedIngredients,
            user_id
          ],
          (err, result) => {
            if (err) {
              console.error("Error inserting meal data:", err);
              return res.status(500).json({ message: 'Error inserting meal data', error: err });
            }

            res.status(201).json({ message: 'Meal data inserted successfully', id: result.insertId });
          }
        );
      }).catch((err) => {
        console.error("Error inserting category:", err);
        return res.status(500).json({ message: 'Error inserting category', error: err });
      });
    }
  );
});


// Delete meal
app.delete('/meals/:mealId', (req, res) => {
  const mealId = req.params.mealId;

  // Query to delete the meal based on the mealId
  const query = `DELETE FROM meals WHERE idMeal = ?`;

  db.query(query, [mealId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error deleting the meal', error: err });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    res.status(200).json({ message: 'Meal successfully deleted' });
  });
});

// Search meals
app.get('/meal', async (req, res) => {
  const search = req.query.search;

  if (!search) {
    return res.status(400).json({ message: "Search term is required" });
  }

  // Query your database for meals based on the search term and include category name
  db.query(`
    SELECT m.*, c.category_name
    FROM meals m
    LEFT JOIN categories c ON m.category_id = c.id
    WHERE m.strMeal LIKE ?`, [`%${search}%`], async (err, results) => {
    if (err) {
      console.error('Error fetching meals:', err);
      return res.status(500).json({ message: "Error fetching meals", error: err });
    }

    const formattedMeals = [];

    for (const meal of results) {
      try {
        // Parse ingredients as JSON or use an empty array if null
        const ingredients = meal.ingredients ? JSON.parse(meal.ingredients) : [];

        // Format ingredients (ensure 20 fields with null if not present)
        const formattedIngredients = {};
        for (let i = 1; i <= 20; i++) {
          formattedIngredients[`strIngredient${i}`] = ingredients[i - 1] || null;
        }

        // Check if the meal exists in TheMealDB API
        try {
          const { data } = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`);
          if (data.meals && data.meals.length > 0) {
            continue; // Skip if the meal exists in TheMealDB
          }
        } catch (apiError) {
          console.error('Error checking TheMealDB API:', apiError);
        }

        // Add the formatted meal to the list
        formattedMeals.push({
          idMeal: String(meal.idMeal),
          strMeal: meal.strMeal,
          strCategory: meal.category_name, // Include the category name here
          strArea: meal.strArea,
          strInstructions: meal.strInstructions,
          strMealThumb: meal.strMealThumb,
          strYoutube: meal.strYoutube,
          ...formattedIngredients,
          user_id: meal.user_id,
          created_at: meal.created_at
        });
      } catch (processError) {
        console.error('Error processing meal:', processError);
      }
    }

    res.json({ meals: formattedMeals });
  });
});


// Fetch all meal categories
app.get('/categories', (req, res) => {
  // Query to fetch all categories
  db.query('SELECT * FROM categories ORDER BY category_name ASC', (err, results) => {
    if (err) {
      console.error('Error fetching categories:', err);
      return res.status(500).json({ message: 'Error fetching categories', error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No categories found.' });
    }

    // Directly return the array of categories
    res.status(200).json(results);
  });
});

// search meal by idMeal
app.get('/meal/:id', async (req, res) => {
  const mealId = req.params.id;

  // Query to fetch meal by ID from custom database
  const query = `SELECT * FROM meals WHERE idMeal = ?`;

  db.query(query, [mealId], async (err, results) => {
    if (err) {
      console.error("Error querying database:", err);
      return res.status(500).json({ error: 'Database query error' });
    }

    if (results.length > 0) {
      // Meal found in custom database, return the meal data
      const meal = results[0];

      // Initialize empty array for ingredients
      let ingredients = [];

      try {
        // Handle ingredients - parse from JSON if it's a valid JSON string
        if (meal.ingredients) {
          ingredients = JSON.parse(meal.ingredients); // Try parsing as JSON
        }
      } catch (error) {
        console.error('Error parsing ingredients:', error);
        return res.status(500).json({ error: 'Error parsing ingredients' });
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
        user_id: meal.user_id,
        created_at: meal.created_at  // Include the creation timestamp
      };

      // Send the response as JSON
      return res.json(response);
    } else {
      // If meal is not found in custom database, fetch from TheMealDB API
      try {
        const apiResponse = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
        
        if (apiResponse.data.meals && apiResponse.data.meals.length > 0) {
          const mealData = apiResponse.data.meals[0];

          // Format the ingredients and measurements into a combined format
          const ingredients = [];
          for (let i = 1; i <= 20; i++) {
            const ingredientKey = `strIngredient${i}`;
            const measureKey = `strMeasure${i}`;

            const ingredient = mealData[ingredientKey];
            const measurement = mealData[measureKey];

            // Check if ingredient and measurement are valid and non-empty
            if (ingredient && ingredient.trim()) {
              // Combine measurement and ingredient and push to the array
              const ingredientWithMeasurement = `${measurement ? measurement.trim() : '1 unit'} ${ingredient.trim()}`;
              ingredients.push(ingredientWithMeasurement);
            }
          }

          // Create the formatted meal data
          const formattedMealData = {
            idMeal: mealData.idMeal,
            strMeal: mealData.strMeal,
            strCategory: mealData.strCategory,
            strArea: mealData.strArea,
            strInstructions: mealData.strInstructions,
            strMealThumb: mealData.strMealThumb,
            strTags: mealData.strTags,
            strYoutube: mealData.strYoutube,
            ingredients: ingredients,
          };

          // Send the formatted data from TheMealDB API as the response
          return res.json(formattedMealData);
        } else {
          return res.status(404).json({ error: 'Meal not found in TheMealDB API' });
        }
      } catch (error) {
        console.error("Error fetching from TheMealDB API:", error);
        return res.status(500).json({ error: 'Error fetching meal details from TheMealDB API' });
      }
    }
  });
})

// Add meal to favorites
app.post('/favorites/add', async (req, res) => {
  const { idMeal, user_id } = req.body;

  // First, check if the meal already exists in the 'meals' table
  db.query('SELECT * FROM meals WHERE idMeal = ?', [idMeal], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }

    // If the meal does not exist in the 'meals' table, insert it
    if (results.length === 0) {
      try {
        // Fetch meal details from TheMealDB API
        const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${idMeal}`);
        const mealDetails = response.data.meals[0];

        // Log the meal details from the API for debugging
        console.log("Meal details from API:", mealDetails);

        // Extract ingredients and measurements into a combined format (measurement + ingredient)
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
          const ingredientKey = `strIngredient${i}`;
          const measureKey = `strMeasure${i}`;

          const ingredient = mealDetails[ingredientKey];
          const measurement = mealDetails[measureKey];

          // Check if ingredient and measurement are valid and non-empty
          if (ingredient && ingredient.trim()) {
            const ingredientWithMeasurement = `${measurement ? measurement.trim() : '1 unit'} ${ingredient.trim()}`;
            ingredients.push(ingredientWithMeasurement);
          }
        }

        // Log the ingredients to check
        console.log("Extracted Ingredients:", ingredients);

        // Format the ingredients as a JSON object
        const ingredientsJson = ingredients.length > 0 ? JSON.stringify(ingredients) : null;

        // Insert meal into the 'meals' table
        const query = `INSERT INTO meals (idMeal, strMeal, strCategory, strArea, strInstructions, strMealThumb, strTags, strYoutube, ingredients, user_id)
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
          user_id
        ], (err, result) => {
          if (err) {
            console.error("Error inserting meal data:", err);
            return res.status(500).json({ message: 'Error inserting meal data', error: err });
          }

          // After the meal is added to the 'meals' table, add it to the 'favorites' table
          addToFavorites();
        });
      } catch (error) {
        console.error("Error fetching meal details from TheMealDB:", error);
        return res.status(500).json({ message: "Error fetching meal details from TheMealDB", error: error });
      }
    } else {
      // If the meal already exists in the 'meals' table, skip insertion and directly add to favorites
      addToFavorites();
    }

    // Helper function to add meal to favorites
    function addToFavorites() {
      db.query('INSERT INTO favorites (user_id, idMeal) VALUES (?, ?)', [user_id, idMeal], (err, result) => {
        if (err) {
          console.error("Error adding to favorites:", err);
          return res.status(500).json({ message: 'Error adding to favorites', error: err });
        }

        res.status(201).json({ message: 'Meal added to favorites' });
      });
    }
  });
})

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

        // Return meal from custom API if available, otherwise return from TheMealDB API
        return mealFromCustomAPI;
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

// checks if the meal is already added in the fav
app.get('/favorites/check/:userId/:mealId', (req, res) => {
  const { userId, mealId } = req.params;

  const query = `
      SELECT 1 
      FROM favorites 
      WHERE user_id = ? AND idMeal = ?
      LIMIT 1
  `;

  db.query(query, [userId, mealId], (err, result) => {
      if (err) {
          console.error('Error checking favorite status:', err);
          return res.status(500).json({ error: 'Internal server error' });
      }

      // If a result exists, return true; otherwise, return false
      const isFavorite = result.length > 0;
      res.json({ isFavorite });
  });
});

// Get the number of users who added a specific meal to their favorites


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

// top 5 favorite meal
app.get('/top_meals', async (req, res) => {
  // Step 1: Get the top 5 favorited meal IDs with their category_id
  db.query(
    `SELECT f.idMeal, COUNT(*) AS favorite_count, m.category_id 
     FROM favorites f
     JOIN meals m ON f.idMeal = m.idMeal  -- Join to get category_id from meals table
     GROUP BY f.idMeal, m.category_id
     ORDER BY favorite_count DESC 
     LIMIT 5`, // Get the top 5 meals with the highest counts
    async (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Database error", error: err });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "No favorites found" });
      }

      try {
        // Step 2: For each meal ID, attempt to fetch meal details
        const mealPromises = results.map((row) => {
          const mealId = row.idMeal;
          const favoriteCount = row.favorite_count;
          const categoryId = row.category_id;

          // Fetch the category name from categories table
          return new Promise((resolve, reject) => {
            const categoryQuery = `SELECT category_name FROM categories WHERE id = ?`;
            db.query(categoryQuery, [categoryId], async (err, categoryResult) => {
              if (err) {
                reject(err);
              }

              const categoryName = categoryResult[0]?.category_name || 'Unknown';

              // Try to fetch meal details from custom API first
              const mealFromCustomAPI = await axios
                .get(`http://192.168.1.185:8800/meal/${mealId}`)
                .then(response => response.data ? response.data : null)
                .catch(() => null);

              // If not found in custom API, fetch from TheMealDB API
              const mealFromTheMealDB = mealFromCustomAPI
                ? null
                : await axios
                    .get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`)
                    .then(response => response.data.meals ? response.data.meals[0] : null)
                    .catch(() => null);

              const mealDetails = mealFromCustomAPI || mealFromTheMealDB;

              if (mealDetails) {
                // Include favorite count and category name with meal details
                mealDetails.favoriteCount = favoriteCount;
                mealDetails.category_name = categoryName;
              }

              resolve(mealDetails);
            });
          });
        });

        // Step 3: Resolve all promises and filter out any null values
        const topMeals = (await Promise.all(mealPromises)).filter(Boolean);

        res.status(200).json({ topMeals });
      } catch (error) {
        return res.status(500).json({ message: "Error fetching meal details", error: error });
      }
    }
  );
});

// top 5 high rated meal
app.get('/top_rated', (req, res) => {
  const query = `
    SELECT m.*, 
           AVG(r.rating) AS averageRating, 
           COUNT(r.rating) AS ratingCount, 
           c.category_name
    FROM meals m
    JOIN ratings r ON m.idMeal = r.meal_id  -- Use 'meal_id' from ratings table
    LEFT JOIN categories c ON m.category_id = c.id  -- Join to get category name
    GROUP BY m.idMeal
    HAVING ratingCount >= 5  -- Optional: only consider meals with 5 or more ratings
    ORDER BY averageRating DESC, ratingCount DESC
    LIMIT 5;
  `;

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database query error", error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "No ratings found" });
    }

    res.status(200).json({ topRatedMeals: results });
  });
});

// fetch meals added by a specific user with their average rating and rating count
app.get('/meals/user/:user_id', (req, res) => {
  const { user_id } = req.params;
  const page = req.query.page || 1;
  const limit = 10; // Adjust as needed
  const offset = (page - 1) * limit;

  const query = `
    SELECT m.*, 
           c.category_name,  -- Fetch category name instead of category ID
           AVG(r.rating) AS averageRating, 
           COUNT(r.rating) AS ratingCount
    FROM meals m
    LEFT JOIN ratings r ON m.idMeal = r.meal_id
    LEFT JOIN categories c ON m.category_id = c.id  -- Ensure 'category_id' in meals matches 'id' in categories
    WHERE m.user_id = ?
    GROUP BY m.idMeal, c.category_name  -- Group by meal ID and category name
    LIMIT ? OFFSET ?;
  `;

  db.query(query, [user_id, limit, offset], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "No meals found for this user" });
    }

    res.status(200).json({ meals: results });
  });
});

// retrieve overall number of users
app.get('/users', (req, res) => {
  const query = `SELECT COUNT(username) AS userCount FROM users WHERE role='user'`;

  db.query(query, (err, result) => {
    if (err) {
      console.error(err); // Log the error for debugging
      return res.status(500).json({ error: "Database query failed" }); // Send an appropriate response
    }

    // Send the result as JSON
    res.status(200).json({ userCount: result[0].userCount });
  });
});

// Insert a new comment for a meal
app.post('/meals/:mealId/comments', (req, res) => {
  const mealId = req.params.mealId;
  const { user_id, comment_text } = req.body;

  // Validate input
  if (!user_id || !comment_text) {
      return res.status(400).json({ error: 'User ID and comment text are required.' });
  }

  // Trim and sanitize input
  const sanitizedCommentText = comment_text.trim();

  const query = `
      INSERT INTO comments (meal_id, user_id, comment_text) 
      VALUES (?, ?, ?)
  `;

  db.query(query, [mealId, user_id, sanitizedCommentText], (err, results) => {
      if (err) {
          console.error('[Database Error]:', err.message);

          // Return detailed or generic error messages
          const errorMessage = process.env.NODE_ENV === 'development'
              ? err.message
              : 'An error occurred while adding the comment.';
          return res.status(500).json({ error: errorMessage });
      }

      // Send response with newly created comment data
      res.status(201).json({
          message: 'Comment added successfully.',
          comment: {
              id: results.insertId,
              meal_id: parseInt(mealId, 10),
              user_id: parseInt(user_id, 10),
              comment_text: sanitizedCommentText,
          },
      });
  });
});

// Retrieve all comments for a specific meal
app.get('/meals/:mealId/comments', (req, res) => {
  const mealId = req.params.mealId;

  const query = `
      SELECT c.comment_id, c.comment_text, c.created_at, u.username
      FROM comments c
      JOIN users u ON c.user_id = u.user_id
      WHERE c.meal_id = ?
      ORDER BY c.created_at DESC
  `;
  db.query(query, [mealId], (err, results) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ error: 'An error occurred while retrieving comments.' });
      }
      res.status(200).json(results);
  });
});

// Delete certain comment
app.delete('/meals/:mealId/comments/:commentId', (req, res) => {
  const { mealId, commentId } = req.params;

  const query = 'DELETE FROM comments WHERE meal_id = ? AND comment_id = ?';
  db.query(query, [mealId, commentId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'An error occurred while deleting the comment.' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    res.status(200).json({ message: 'Comment deleted successfully.' });
  });
});

// Total meals
app.get('/total/meals', (req, res) => {
  const query = `SELECT COUNT(*) AS total FROM meals`;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error querying total meals:', err);
      return res.status(500).json({ error: 'Database query error' });
    }

    // Extract the total count from the results
    const totalMeals = results[0].total;

    // Respond with the total
    res.json({ total: totalMeals });
  });
});

// Fetch all pending recipes
app.get('/pending', (req, res) => {
  const query = 'SELECT * FROM pending_recipes WHERE status = "pending"';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching pending recipes:', err);
      return res.status(500).json({ error: 'Database query error' });
    }

    res.json(results);
  });
});

// Fetch total number of pending recipes
app.get('/pending/recipes/total', (req, res) => {
  const query = `SELECT COUNT(*) AS total FROM pending_recipes`;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching total pending recipes:', err);
      return res.status(500).json({ error: 'Database query error' });
    }

    // Extract the total from the query result
    const total = results[0].total;

    res.json({ total });
  });
});

// Total number if categories available
app.get('/categories/total', (req, res) => {
  // Query to count all categories
  db.query('SELECT COUNT(*) AS categoryCount FROM categories', (err, results) => {
    if (err) {
      console.error('Error counting categories:', err);
      return res.status(500).json({ message: 'Error counting categories', error: err });
    }

    // Return the count of categories
    const count = results[0].categoryCount;
    res.status(200).json({ categoryCount: count });
  });
});

// Approve and move recipe to meals table
app.post('/pending/approve/:id', (req, res) => {
  const recipeId = req.params.id;

  // Query to fetch the recipe from pending_recipes
  const fetchQuery = 'SELECT * FROM pending_recipes WHERE id = ?';

  db.query(fetchQuery, [recipeId], (err, results) => {
    if (err) {
      console.error('Error fetching the recipe:', err);
      return res.status(500).json({ error: 'Database query error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Recipe not found or already processed.' });
    }

    const recipe = results[0];

    // Query to insert into meals table
    const insertQuery = `
      INSERT INTO meals (idMeal, strMeal, category_id, strArea, strInstructions, strMealThumb, strYoutube, ingredients, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      recipe.id,         // Use the same ID or generate a new one if necessary
      recipe.strMeal,
      recipe.category_id, // Use category_id directly from pending_recipes
      recipe.strArea,
      recipe.strInstructions,
      recipe.strMealThumb,
      recipe.strYoutube,
      recipe.ingredients,
      recipe.user_id,
    ];

    db.query(insertQuery, values, (insertErr) => {
      if (insertErr) {
        console.error('Error inserting recipe into meals table:', insertErr);
        return res.status(500).json({ error: 'Failed to approve the recipe.' });
      }

      // Query to delete from pending_recipes
      const deleteQuery = 'DELETE FROM pending_recipes WHERE id = ?';

      db.query(deleteQuery, [recipeId], (deleteErr) => {
        if (deleteErr) {
          console.error('Error deleting recipe from pending_recipes:', deleteErr);
          return res.status(500).json({ error: 'Failed to remove recipe from pending list.' });
        }

        res.status(201).json({ message: 'Recipe approved and moved to meals table.' });
      });
    });
  });
});



// Reject a recipe by deleting it
app.delete('/pending/reject/:id', (req, res) => {
  const recipeId = req.params.id;

  // Query to delete the recipe from pending_recipes
  const deleteQuery = 'DELETE FROM pending_recipes WHERE id = ?';

  db.query(deleteQuery, [recipeId], (err, results) => {
    if (err) {
      console.error('Error rejecting the recipe:', err);
      return res.status(500).json({ error: 'Failed to reject the recipe.' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Recipe not found.' });
    }

    res.status(201).json({ message: 'Recipe rejected and removed from pending list.' });
  });
});

// add recipe into pending table
app.post('/pending/add', (req, res) => {
  const {
    strMeal,
    category_id,  // Updated to use category_id instead of strCategory
    strArea,
    strInstructions,
    strMealThumb,
    strYoutube,
    ingredients,
    user_id,
  } = req.body;

  // Validate required fields
  if (!strMeal || !category_id || !strInstructions || !ingredients || !user_id) {
    return res.status(400).json({ error: 'Missing required fields: strMeal, category_id, strInstructions, ingredients, user_id are required.' });
  }

  // Validate ingredients array is not empty
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: 'Ingredients must be a non-empty array.' });
  }

  // Query to insert recipe into pending_recipes
  const query = `
    INSERT INTO pending_recipes 
    (strMeal, category_id, strArea, strInstructions, strMealThumb, strYoutube, ingredients, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    strMeal,
    category_id,  // Insert category_id instead of strCategory
    strArea || null,
    strInstructions,
    strMealThumb || null,
    strYoutube || null,
    JSON.stringify(ingredients), // Convert ingredients array to JSON
    user_id,
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error inserting recipe into pending_recipes:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(201).json({ message: 'Recipe added to pending list.', recipeId: result.insertId });
  });
});


// generate otp for email verification and password recovery
app.post("/otp/request", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const currentTime = new Date();

  // Check if email exists in the users table
  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", error: err });

    if (results.length === 0) {
      return res.status(404).json({ message: "Email doesn't exist in our records" });
    }

    // Email exists in the users table, now check for cooldown period
    db.query(
      "SELECT last_requested_at FROM otps WHERE email = ?",
      [email],
      async (err, results) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });

        const lastRequestedAt = results[0]?.last_requested_at;

        // Check if cooldown period has passed (1 minute)
        if (lastRequestedAt && new Date(lastRequestedAt).getTime() + 60000 > currentTime.getTime()) {
          return res.status(429).json({ message: "Please wait 1 minute before requesting another OTP" });
        }

        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
        const expiresAt = new Date(currentTime.getTime() + 5 * 60000); // OTP valid for 5 minutes

        // Send OTP via Brevo first
        try {
          await brevo.sendTransacEmail({
            sender: { email: "danpirante9@gmail.com", name: "Recipe Radar" },
            to: [{ email }],
            subject: "Your OTP Code",
            textContent: `Your OTP is ${otp}. It will expire in 5 minutes.`,
          });

          // Insert or update OTP in the database only after email is successfully sent
          db.query(
            "INSERT INTO otps (email, otp, expires_at, last_requested_at) VALUES (?, ?, ?, ?) " +
              "ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?, last_requested_at = ?",
            [email, otp, expiresAt, currentTime, otp, expiresAt, currentTime],
            (err) => {
              if (err) return res.status(500).json({ message: "Database error", error: err });

              return res.status(200).json({ message: "OTP sent and saved successfully" });
            }
          );

        } catch (emailErr) {
          // If email fails, return an error response
          return res.status(500).json({ message: "Error sending email", error: emailErr });
        }
      }
    );
  });
});

// verify if the otp is valid, expired, or invalid
app.post("/otp/verify", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  // Check if the email exists and fetch OTP data from the database
  db.query("SELECT * FROM otps WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", error: err });

    if (results.length === 0) {
      return res.status(404).json({ message: "Email not found or OTP not generated" });
    }

    const otpRecord = results[0];

    // Check if OTP is valid and hasn't expired
    const currentTime = new Date();
    const otpExpiresAt = new Date(otpRecord.expires_at);
    
    if (currentTime > otpExpiresAt) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Check if the OTP entered by the user matches the stored OTP
    if (otp !== otpRecord.otp) {
      return res.status(402).json({ message: "Invalid OTP" });
    }

    // OTP is valid
    return res.status(200).json({ message: "OTP verified successfully" });
  });
});

// change password
app.post('/change-password', (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;

  // Check if newPassword and confirmPassword match
  if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirm password do not match' });
  }

  // Check if the user exists by email
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
      if (err) {
          return res.status(500).json({ message: 'Server error' });
      }

      if (results.length === 0) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Update the password in the database (plaintext)
      db.query('UPDATE users SET password = ? WHERE email = ?', [newPassword, email], (updateErr) => {
          if (updateErr) {
              return res.status(500).json({ message: 'Error updating password' });
          }

          res.status(200).json({ message: 'Password successfully updated' });
      });
  });
});