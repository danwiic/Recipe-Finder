import { useState } from "react";
import Layout from "../Components/Layout";
import { FaSearch } from "react-icons/fa";
import Loader from '../Components/Loader'; 
import './Style/Landing.css';
import axios from "axios";
import Popup from "../Components/Popup";


export default function Landing() {
    const [search, setSearch] = useState({ search: "" });
    const [results, setResults] = useState([]); 
    const [loading, setLoading] = useState(false);  
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(false);
    const [selectedMeal, setSelectedMeal] = useState(null);  // Track selected meal

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSearch(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!search.search.trim()) return; // If search input is empty, do nothing

        setLoading(true);  
        setError(null);    
        setResults([]);   

        try {
            const { data } = await axios.get(`https://www.themealdb.com/api/json/v1/1/search.php?s=${search.search}`);
            
            if (data.meals) {
                setResults(data.meals); // Set results if found
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

    // Function to handle meal selection for the popup
    const handleViewRecipe = (meal) => {
        setSelectedMeal(meal);
        setOpen(true);
    };

    return (
        <div className="recipe__container">
            <Layout>
                <div className="recipe__layout">
                    <h2 className="tag">Discover, Cook, Enjoy!</h2>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            name="search"
                            value={search.search}
                            onChange={handleChange}
                            placeholder="Search for a meal..."
                        />
                        <button 
                            className="btn__search" 
                            type="submit"
                            disabled={loading}  // Disable search button while loading
                        >
                            <FaSearch />
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

            {open && 
                <Popup 
                    trigger={open} 
                    setTrigger={setOpen} 
                >
                   
                    <h2>{selectedMeal.strMeal}</h2>
                    <div className="popup__layout">
                    <img 
                        src={selectedMeal.strMealThumb} 
                        alt={selectedMeal.strMeal} 
                        className="popup__img"
                    />
                    <div className="meal__details">
                        <div className="popup__description">
                        <h3>Instructions</h3>
                        <p className="meal__instructions">{selectedMeal.strInstructions}</p>
                        <h3>Ingredients:</h3>

                        {[...Array(20)].map((_, index) => {
                            const ingredient = selectedMeal[`strIngredient${index + 1}`];
                            const measure = selectedMeal[`strMeasure${index + 1}`];
                            if (ingredient) {
                                return (
                                    <li key={index} className="meal__ingredient">
                                        {ingredient} - {measure}
                                    </li>
                                );
                            }
                            return null;
                        })}
                    </div>
                    </div>
                    </div>
                </Popup>
            }
        </div>
    );
}
