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
  const { strMeal, strCategory, strArea, strInstructions, strMealThumb, strTags, strYoutube, ingredients, user_id } = req.body;

  // Combine ingredients and measurements (ingredients array provided by the user)
  const formattedIngredients = ingredients.map(item => item.trim());

  // Convert the ingredients array to a JSON string
  const ingredientsJson = JSON.stringify(formattedIngredients);

  // SQL query to insert the meal into the test table
  const query = `
  INSERT INTO meals (strMeal, strCategory, strArea, strInstructions, strMealThumb, strTags, strYoutube, ingredients, user_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

db.query(query, [
  strMeal,
  strCategory,
  strArea,
  strInstructions,
  strMealThumb,
  strTags,
  strYoutube,
  ingredientsJson,
  user_id
], (err, result) => {
  if (err) {
    console.error("Error inserting meal data:", err);
    return res.status(500).json({ message: 'Error inserting meal data', error: err });
  }

  // Send a response confirming successful insertion
  res.status(201).json({ message: 'Meal data inserted successfully', id: result.insertId });
});
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
});


// Add meal to favorites
app.post('/favorites/add', async (req, res) => {
  const { idMeal, user_id } = req.body;

  // Check if the meal already exists in the test table
  db.query('SELECT * FROM test WHERE idMeal = ?', [idMeal], async (err, results) => {
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

        // Extract ingredients and measurements into a combined format (measurement + ingredient)
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
          const ingredientKey = `strIngredient${i}`;
          const measureKey = `strMeasure${i}`;

          const ingredient = mealDetails[ingredientKey];
          const measurement = mealDetails[measureKey];

          // Check if ingredient and measurement are valid and non-empty
          if (ingredient && ingredient.trim()) {
            // Combine measurement and ingredient and push to the array
            const ingredientWithMeasurement = `${measurement ? measurement.trim() : '1 unit'} ${ingredient.trim()}`;
            ingredients.push(ingredientWithMeasurement);
          }
        }

        // Log the ingredients to check
        console.log("Extracted Ingredients:", ingredients);

        // Format the ingredients as a JSON object
        const ingredientsJson = ingredients.length > 0 ? JSON.stringify(ingredients) : null;

        // Log the formatted data before insertion
        console.log("Formatted Ingredients JSON:", ingredientsJson);

        // Insert meal into the test table
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

          // After the meal is added to the test table, now add it to favorites
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
      // If the meal already exists in the test table, just add to favorites
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
  // Step 1: Get the top 5 favorited meal IDs
  db.query(
    `SELECT idMeal, COUNT(*) AS favorite_count 
     FROM favorites 
     GROUP BY idMeal 
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
        const mealPromises = results.map(async (row) => {
          const mealId = row.idMeal;
          const favoriteCount = row.favorite_count;

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
            // Include favorite count with meal details
            mealDetails.favoriteCount = favoriteCount;
          }

          return mealDetails;
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
    SELECT m.*, AVG(r.rating) AS averageRating, COUNT(r.rating) AS ratingCount
    FROM meals m
    JOIN ratings r ON m.idMeal = r.meal_id  -- Use 'meal_id' from ratings table
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

  const query = `
    SELECT m.*, 
           AVG(r.rating) AS averageRating, 
           COUNT(r.rating) AS ratingCount
    FROM meals m
    LEFT JOIN ratings r ON m.idMeal = r.meal_id
    WHERE m.user_id = ?
    GROUP BY m.idMeal;
  `;

  db.query(query, [user_id], (err, results) => {
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


// Approve and move recipe to meals table
app.post('/approve/recipe/:id', (req, res) => {
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
      INSERT INTO meals (idMeal, strMeal, strCategory, strArea, strInstructions, strMealThumb, strTags, strYoutube, ingredients, user_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      recipe.id,         // Use the same ID or generate a new one if necessary
      recipe.strMeal,
      recipe.strCategory,
      recipe.strArea,
      recipe.strInstructions,
      recipe.strMealThumb,
      recipe.strTags,
      recipe.strYoutube,
      recipe.ingredients,
      recipe.user_id,
      recipe.created_at,
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

        res.json({ message: 'Recipe approved and moved to meals table.' });
      });
    });
  });
});

// Reject a recipe by deleting it
app.delete('/reject/recipe/:id', (req, res) => {
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

    res.json({ message: 'Recipe rejected and removed from pending list.' });
  });
});

// add recipe into pending table
app.post('/pending/add', (req, res) => {
  const {
    strMeal,
    strCategory,
    strArea,
    strInstructions,
    strMealThumb,
    strTags,
    strYoutube,
    ingredients,
    user_id,
  } = req.body;

  // Validate required fields
  if (!strMeal || !strInstructions || !ingredients || !user_id) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  // Query to insert recipe into pending_recipes
  const query = `
    INSERT INTO pending_recipes 
    (strMeal, strCategory, strArea, strInstructions, strMealThumb, strTags, strYoutube, ingredients, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    strMeal,
    strCategory || null,
    strArea || null,
    strInstructions,
    strMealThumb || null,
    strTags || null,
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
