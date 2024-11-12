import React, { useState, useEffect } from 'react';
import Layout from "../Components/Layout";
import Loader from '../Components/Loader';
import './Style/Landing.css';
import axios from "axios";
import searchIcon from '/search.png';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
    const [search, setSearch] = useState({ search: "" });
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedSearch = localStorage.getItem('search');
        const storedResults = localStorage.getItem('results');
        
        if (storedSearch) setSearch({ search: storedSearch });
        if (storedResults) setResults(JSON.parse(storedResults));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSearch(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const formatMealData = (meal) => {
        const ingredients = meal.ingredients || {};
        const measurements = meal.measurements || {};
        const formattedIngredients = [];
        const formattedMeasurements = [];
    
        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            
            if (ingredient && ingredient.trim()) {
                formattedIngredients.push(ingredient.trim());
                formattedMeasurements.push(measure ? measure.trim() : '');
            }
        }

        return {
            ...meal,
            ingredients: formattedIngredients,
            measurements: formattedMeasurements,
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!search.search.trim()) return;
        setLoading(true);
        setError(null);
        setResults([]);
    
        try {
            const mealDbResponse = await axios.get(`https://www.themealdb.com/api/json/v1/1/search.php?s=${search.search}`);
            const mealDbResults = mealDbResponse.data.meals ? mealDbResponse.data.meals.map(formatMealData) : [];
    
            const customApiResponse = await axios.get(`http://192.168.1.185:8800/meal?search=${search.search}`);
            const customApiResults = customApiResponse.data.meals ? customApiResponse.data.meals.map(formatMealData) : [];
    
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
