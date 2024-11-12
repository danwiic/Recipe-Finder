import React, { useState, useEffect } from 'react';
import Layout from "../Components/Layout";
import Loader from '../Components/Loader';
import './Style/Landing.css';
import axios from "axios";
import Popup from "../Components/Popup";
import ReactPlayer from 'react-player/youtube';
import searchIcon from '/search.png';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
    const [search, setSearch] = useState({ search: "" });
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    console.log("modified: ", results);

    useEffect(() => {
        const storedSearch = localStorage.getItem('search');
        const storedResults = localStorage.getItem('results');
        
        if (storedSearch) setSearch({ search: storedSearch });
        if (storedResults) setResults(JSON.parse(storedResults));
    }, []);

    const formatMealData = (meal) => {
        // Check if the meal data has ingredients and measurements fields
        const ingredients = meal.ingredients || {};
        const measurements = meal.measurements || {};
        const formattedIngredients = [];
        const formattedMeasurements = [];
    
        // Loop through properties in the `meal` object that may contain ingredient and measure keys
        for (let i = 1; i <= 20; i++) {
            const ingredientKey = `strIngredient${i}`;
            const measureKey = `strMeasure${i}`;
            
            const ingredient = meal[ingredientKey];
            const measurement = meal[measureKey];
            
            // Only add non-empty ingredients and measurements
            if (ingredient && ingredient.trim()) {
                formattedIngredients.push(ingredient.trim());
                formattedMeasurements.push(measurement ? measurement.trim() : '');
            }
        }

        // If the meal data contains ingredients or measurements in JSON format (e.g., LONGTEXT), try parsing them
        try {
            if (meal.ingredients && typeof meal.ingredients === 'string') {
                meal.ingredients = JSON.parse(meal.ingredients);
            }
            if (meal.measurements && typeof meal.measurements === 'string') {
                meal.measurements = JSON.parse(meal.measurements);
            }
        } catch (error) {
            console.error("Error parsing ingredients/measurements JSON:", error);
        }

        return {
            ...meal, // include other meal details
            ingredients: formattedIngredients.length ? formattedIngredients : meal.ingredients || [],
            measurements: formattedMeasurements.length ? formattedMeasurements : meal.measurements || [],
        };
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSearch(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!search.search.trim()) return;
        setLoading(true);
        setError(null);
        setResults([]);
    
        try {
            // Call TheMealDB API
            const mealDbResponse = await axios.get(`https://www.themealdb.com/api/json/v1/1/search.php?s=${search.search}`);
            const mealDbResults = mealDbResponse.data.meals ? mealDbResponse.data.meals.map(formatMealData) : [];
    
            // Call custom API
            const customApiResponse = await axios.get(`http://192.168.1.185:8800/meal?search=${search.search}`);
            const customApiResults = customApiResponse.data.meals ? customApiResponse.data.meals.map(formatMealData) : [];
    
            // Combine results from both APIs
            const combinedResults = [...mealDbResults, ...customApiResults];
            
            if (combinedResults.length > 0) {
                setResults(combinedResults);
                localStorage.setItem('search', search.search);
                localStorage.setItem('results', JSON.stringify(combinedResults));
            } else {
                setError("No meals found for your search.");
            }
        } catch (e) {
            setError("An error occurred while fetching the data.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleViewRecipe = (recipe) => {
        navigate(`/recipe/${recipe.idMeal}`);
    };

    return (
        <div className="recipe__container">
            <Layout>
                <div className="recipe__layout">
                    <h2 className="tag">Search, Cook, Enjoy!</h2>
                    <form onSubmit={handleSubmit} className="searchbar">
                        <input
                            style={{backgroundImage: `url(${searchIcon})`}}
                            type="text"
                            name="search"
                            value={search.search}
                            onChange={handleChange}
                            placeholder="Search for a meal..."
                        />
                        <button 
                            className="btn__search" 
                            type="submit"
                        >
                            Search
                        </button>
                    </form>

                    <div className="show__loading">
                        {loading && <Loader />}
                    </div>

                    {error && <div className="error">{error}</div>}

                    <div className="results">
                        {results && results.length > 0 && (
                            <div className="meal__result">
                                <h3 className="search__result">Results:</h3>
                                {results.map(result => (
                                    <div className="meal__list" key={result.idMeal}>
                                        <img 
                                            id={result.idMeal} 
                                            src={result.strMealThumb} 
                                            alt={result.strMeal} 
                                            className="meal__img" 
                                        />
                                        <div className="content">
                                            <div className="meal__name">{result.strMeal}</div>
                                            <div className="content__details">
                                                <div>Category: {result.strCategory}</div>
                                                <button 
                                                    className="view__recipe"
                                                    onClick={() => handleViewRecipe(result)}  
                                                >
                                                    View Recipe
                                                </button>
                                          </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div> 
            </Layout>
        </div>
    );
}
