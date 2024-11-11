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
    console.log("modified: ",results);
    
    useEffect(() => {
        const storedSearch = localStorage.getItem('search');
        const storedResults = localStorage.getItem('results');
        
        if (storedSearch) setSearch({ search: storedSearch });
        if (storedResults) setResults(JSON.parse(storedResults));
    }, []);

    const formatMealData = (meal) => {
        const ingredients = meal.ingredients || {};
        const measurements = meal.measurements || {};
    
        // Create arrays to hold the formatted data
        const formattedIngredients = [];
        const formattedMeasurements = [];
    
        for (let i = 1; i <= 20; i++) {
            const ingredient = ingredients[`ingredient${i}`];
            const measurement = measurements[`measurement${i}`];
    
            if (ingredient) {
                formattedIngredients.push(ingredient.trim());
                formattedMeasurements.push(measurement ? measurement.trim() : '');
            }
        }
    
        return {
            ingredients: formattedIngredients,
            measurements: formattedMeasurements,
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
            const { data } = await axios.get(`https://www.themealdb.com/api/json/v1/1/search.php?s=${search.search}`);
            
            if (data.meals) {
                const formattedMeals = data.meals.map(meal => {
                    return {
                        ...meal,
                        ...formatMealData(meal), 
                    };
                });
                
                setResults(formattedMeals)
                localStorage.setItem('search', search.search);
                localStorage.setItem('results', JSON.stringify(formattedMeals));
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
