import axios from "axios";
import { db } from "./db.js"
import express from "express";


const app = express();
app.use(express.json())

app.listen(8800, () => {
    console.log("Server running")
})

app.post("/by_area", async (req, res) => {
    try {
        // Optionally, get area from the request body (e.g., req.body.area)
        const { area } = req.body; 
    
        if (!area) {
          return res.status(400).json({ error: 'Area is required' });
        }
    
        // Make a request to TheMealDB API to filter meals by area
        const mealDbResponse = await axios.get(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${area}`);
    
        // Check if meals are found
        const mealDbMeals = mealDbResponse.data.meals || [];
    
        // Return meals data
        res.json(mealDbMeals);
      } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch data from TheMealDB' });
      }
    
})