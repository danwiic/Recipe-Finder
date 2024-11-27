import { useEffect, useState } from "react";
import Layout from "../Components/Layout";
import "./Style/Favorites.css";
import axios from 'axios';
import { useUser } from "../Context/UserContext";
import Loader from "../Components/Loader";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router";
import { Rating } from 'react-simple-star-rating';
import { FaHeart } from "react-icons/fa";

export default function Recipe() {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useUser();
    const navigate = useNavigate();
    
    const fetchFavorite = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`http://192.168.1.185:8800/favorites/${user.id}`);
            console.log(res.data)
            const mealsWithRatings = await Promise.all(
                res.data.meals.map(async (meal) => {
                    const avgRating = await fetchAverageRating(meal.idMeal);
                    return { ...meal, averageRating: avgRating };
                })
            );
            setFavorites(mealsWithRatings);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAverageRating = async (mealId) => {
        try {
            const res = await axios.get(`http://192.168.1.185:8800/ratings/average/${mealId}`);
            return res.data.averageRating || 0;  // Return 0 if no rating exists
        } catch (error) {
            console.error(error);
            return 0;
        }
    };

    const fetchUserRating = async (mealId) => {
        try {
            const res = await axios.get(`http://192.168.1.185:8800/ratings/user/${mealId}/${user.id}`);
            return res.data.rating || 0;  // Return the user's rating if available, otherwise return 0
        } catch (error) {
            console.error(error);
            return 0;
        }
    };

    const handleViewRecipe = (recipe) => {
        navigate(`/recipe/${recipe.idMeal}`);
    };
    
    const handleRemoveFromFavorites = async (idMeal) => {
        // Optimistically update the UI
        const updatedFavorites = favorites.filter((meal) => meal.idMeal !== idMeal);
        setFavorites(updatedFavorites);
    
        try {
            const res = await axios.post('http://192.168.1.185:8800/favorites/remove', {
                user_id: user.id,
                idMeal: idMeal,
            });
    
            if (res.status !== 200) {
                throw new Error("Failed to remove favorite");
            }
        } catch (error) {
            console.error("Error removing from favorites:", error);
            // Rollback UI update in case of failure
            setFavorites(updatedFavorites);
        }
    };

    const goAdd = () => {
        navigate('/home')
    }

    useEffect(() => {
        fetchFavorite();
    }, [])

    return (
        <>
            <Layout>
                <div className="fav__layout">
                    <h2>FAVORITES</h2>

                    {loading ? (
                        <div className="loader">
                            <Loader />
                        </div>
                    ) : (
                        favorites.length > 0 ? (
                            <div className="favorite__list">
                               {favorites.map((meal, index) => (
                                    <div key={index} className="meal__item">
                                        <div className="meal__name">{meal.strMeal.toUpperCase()}</div>

                                        <div className="meal__item__layout">
                                            <img src={meal.strMealThumb} alt={meal.strMeal} />

                                                <div className="ratings">
                                                    <span>
                                                        {meal.averageRating.toFixed(1)}
                                                            <Rating
                                                            readonly
                                                            initialValue={meal.averageRating}  
                                                            className="rate"
                                                        />
                                                    </span> 
                                                
                                                    <div className="fav__icon">
                                                        <FaHeart 
                                                            onClick={() => handleRemoveFromFavorites(meal.idMeal)}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="action">
                                                    <button 
                                                        className="btn__view"
                                                        onClick={() => handleViewRecipe(meal)}
                                                    >VIEW RECIPE
                                                    </button>
                                                </div>
                                        </div>
                                    </div>
                                ))}

                            </div>
                        ) : (
                            <>
                                <p>You don't have any favorite meals yet!</p>
                                <button
                                    onClick={goAdd}
                                >ADD <FaPlus /></button>
                            </>
                        )
                    )}
                </div>
            </Layout>
        </>
    );
};
