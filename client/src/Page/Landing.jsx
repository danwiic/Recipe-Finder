import { useState } from "react"
import Layout from "../Components/Layout"
import { FaSearch } from "react-icons/fa"
import Loader from '../Components/Loader'
import './Style/Landing.css'
import axios from "axios"
import Popup from "../Components/Popup"
import ReactPlayer from 'react-player/youtube'
import searchIcon from '../../public/search.png'


export default function Landing() {
    const [search, setSearch] = useState({ search: "" })
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false) 
    const [error, setError] = useState(null)
    const [open, setOpen] = useState(false)
    const [selectedMeal, setSelectedMeal] = useState(null)

    const handleChange = (e) => {
        const { name, value } = e.target
        setSearch(prevState => ({
            ...prevState,
            [name]: value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!search.search.trim()) return
        setLoading(true)
        setError(null)
        setResults([])

        try {
            const { data } = await axios.get(`https://www.themealdb.com/api/json/v1/1/search.php?s=${search.search}`);
            
            if (data.meals) {
                setResults(data.meals)
            } else {
                setError("No meals found for your search.")
            }
        } catch (e) {
            setError("An error occurred while fetching the data.")
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleViewRecipe = (meal) => {
        setSelectedMeal(meal)
        setOpen(true)
    }

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

            {open && 
                <Popup 
                    trigger={open} 
                    setTrigger={setOpen} 
                >
                   
                    <h2>{selectedMeal.strMeal}</h2>
                    <div className="popup__layout">

                            <div className="meal__video">
                                <ReactPlayer  url={selectedMeal.strYoutube} />
                            </div>
                    
                        <div className="meal__details">
                            <div className="popup__description">
                                <h3>Instructions</h3>
                                <ol className="meal__instructions">
                                {selectedMeal.strInstructions
                                    .split('. ') 
                                    .map((step, index) => {
                                    if (step.trim()) {
                                        return <li key={index}>{step.trim()}.</li>;
                                    }
                                    return null;
                                    })}
                                </ol>

                                <h3>Ingredients:</h3>
                                <ul>
                                {[...Array(20)].map((_, index) => {
                                    const ingredient = selectedMeal[`strIngredient${index + 1}`];
                                    const measure = selectedMeal[`strMeasure${index + 1}`];
                                    if (ingredient) {
                                    return (
                                        <li key={index} className="meal__ingredient">
                                       <span className="meal__measure">{measure}</span> - {ingredient}  
                                        </li>
                                    );
                                    }
                                    return null;
                                })}
                                </ul>
                            </div>
                            </div>
                    </div>
                </Popup>
            }
        </div>
    );
}
