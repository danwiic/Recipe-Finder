import { useState } from "react";
import Layout from "../Components/Layout";
import { FaSearch } from "react-icons/fa";
import Loader from '../Components/Loader'; 
import './Style/Landing.css';
import axios from "axios";


export default function Landing() {

    const [search, setSearch] = useState({
        search: ""
    });
    
    const [results, setResults] = useState([]); 
    const [loading, setLoading] = useState(false);  
    const [error, setError] = useState(null);

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
                setResults(data.meals); 
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

    return (
        <div className="recipe__container">
            <Layout>
                <div className="recipe__layout">

                    <h3 className="tag">Discover, Cook, Enjoy!</h3>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            name="search"
                            value={search.search}
                            onChange={handleChange}
                            placeholder="Search for a meal..."
                        />
                        <button className="btn__search" type="submit">
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
                            <div className="meal__list" id={result.idMeal}>
                                <img src={result.strMealThumb} alt={result.strMeal} className="meal__img" />

                                <div className="content">
                                    <div className="meal__name">{result.strMeal}</div>
                                    <span className="view__recipe">View Recipe</span>
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
