import React, { useState, useEffect } from 'react';
import Layout from "../Components/Layout";
import Loader from '../Components/Loader';
import './Style/Landing.css';
import axios from "axios";
import searchIcon from '/search.png';
import { useNavigate } from 'react-router-dom';
import { Rating } from 'react-simple-star-rating';
import { useUser } from '../Context/UserContext';
useUser

export default function Landing() {
    const [search, setSearch] = useState({ search: "" });
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [topMeal, setTopMeal] = useState([])
    const {user} = useUser()
    const [ratedMeal, setRatedMeal] = useState({})

    useEffect(() => {
      fetchTopMeal()
      fetchTopRatedMeal()
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

    const fetchTopMeal = async () => {
        try{
            setLoading(true)
            const res = await axios.get("http://192.168.1.185:8800/top_meals")
            const topMeals = res.data.topMeals
            setTopMeal(topMeals)
        }catch(error){
            console.error(error);
        }finally{
            setLoading(false)
        }
    }

    const fetchTopRatedMeal = async () => {
        try {
            setLoading(true);
            const res = await axios.get("http://192.168.1.185:8800/top_rated");
            const topRatedMeal = res.data.topRatedMeals; // Access the topRatedMeals array directly
            setRatedMeal(topRatedMeal); // Update the state with the array of meals
            console.log("Top Rated Meals:", topRatedMeal); // Log the meals for debugging
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };


console.log("lolo: ", ratedMeal);


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
            

            const mealsWithRatings = await Promise.all(
                combinedResults.map(async (meal) => {
                    const avgRating = await fetchAverageRating(meal.idMeal);
                    return { ...meal, averageRating: avgRating };
                })
            );

            setResults(mealsWithRatings)
            
            
            
            if (mealsWithRatings.length > 0) {
                setResults(mealsWithRatings);
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
    }

    const fetchAverageRating = async (mealId) => {
        try {
            const res = await axios.get(`http://192.168.1.185:8800/ratings/average/${mealId}`);
            return res.data || 0
        } catch (error) {
            console.error(error);
            return 0;
        }
    };
    
console.log("results: 1 ", results);

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
                            FIND
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
                            <div className="meal__result_con">
                                {results.map(result => (
                                    <div className="meal__list" key={result.idMeal}>
                                        
                                    
                                       <div className="img__con">
                                       <img 
                                            id={result.idMeal} 
                                            src={result.strMealThumb} 
                                            alt={result.strMeal} 
                                            className="meal__img" 
                                        />
                                        </div> 
                                        <div className="meal__name">{result.strMeal.toUpperCase()}</div>

                                        <div className="content">
                                            <div className="content__details">
                                                <div className='meal__cat'>Category: {result.strCategory}</div>
                                                   {result.averageRating ? (
                                                     <span className='meal__rating'>
                                                     {result.averageRating.averageRating.toFixed(1)}
                                                         <Rating
                                                         readonly
                                                         initialValue={result.averageRating.averageRating}  
                                                         className="rate"
                                                     />
                                                     ({result.averageRating.ratingCount})
                                                 </span> 
                                                   ) : (
                                                    <span className='meal__rating'>
                                                        0
                                                         <Rating
                                                         readonly
                                                         initialValue={0}  
                                                         className="rate"
                                                     />
                                                     (0)
                                                    </span>
                                                   )}
                                                <button 
                                                    className="view__recipe"
                                                    onClick={() => handleViewRecipe(result)}  
                                                >
                                                    VIEW RECIPE
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                ))}
                            </div>
                          </div>
                        )}
                    </div>
                </div> 


                {ratedMeal && ratedMeal.length > 0 ? (
                <div className="top__meal">
                    <h3>TOP 5 HIGH RATED RECIPES</h3>
                    <div className="meals">
                    {ratedMeal.map((result) => (
                        <div className="meal__list" key={result.idMeal}>
                        <div className="img__con">
                            <img 
                            id={result.idMeal} 
                            src={result.strMealThumb} 
                            alt={result.strMeal} 
                            className="meal__img" 
                            />
                        </div>
                        <div className="meal__name">{result.strMeal.toUpperCase()}</div>
                        <div className="content">
                            <div className="content__details">
                            <div className='meal__cat'>Category: {result.strCategory}</div>
                            {result.averageRating ? (
                                <span className='meal__rating'>
                                {result.averageRating.toFixed(1)}
                                <Rating
                                    readonly
                                    initialValue={result.averageRating}  
                                    className="rate"
                                />
                                ({result.ratingCount})
                                </span>
                            ) : (
                                <span className='meal__rating'>
                                0
                                <Rating
                                    readonly
                                    initialValue={0}  
                                    className="rate"
                                />
                                (0)
                                </span>
                            )}
                            <button 
                                className="view__recipe"
                                onClick={() => handleViewRecipe(result)}  
                            >
                                VIEW RECIPE
                            </button>
                            </div>
                        </div>
                        </div>
                    ))}
                    </div>
                </div>
                ) : (
                <div>No top-rated recipes available.</div>
                )}

                {topMeal && (
                    <div className="top__meal">
                        <h3>TOP 5 FAVORITE RECIPE</h3>
                    <div className='meals'>
                        {topMeal.map((result, i) => (
                                <div className="meal__list" key={result.idMeal}>
                                        <div className="img__con">
                                        <img 
                                             id={result.idMeal} 
                                             src={result.strMealThumb} 
                                             alt={result.strMeal} 
                                             className="meal__img" 
                                         />
                                         </div> 
                                         <div className="meal__name">{result.strMeal.toUpperCase()}</div>
 
                                         <div className="content">
                                             <div className="content__details">
                                                 <div className='meal__cat'>Category: {result.strCategory}</div>
                                                    {result && (
                                                        <div className='fav__count'>
                                                            <div className="p">FAVORITE OF: <span className='no__count'>{result.favoriteCount} User</span> </div>
                                                        </div>
                                                    )}
                                                 <button 
                                                     className="view__recipe"
                                                     onClick={() => handleViewRecipe(result)}  
                                                 >
                                                     VIEW RECIPE
                                                 </button>
                                             </div>
                                         </div>
 
                                     </div>
                                
                            ))}
                    </div>

                </div>
                )}

                

            </Layout>
        </div>
    );
}
