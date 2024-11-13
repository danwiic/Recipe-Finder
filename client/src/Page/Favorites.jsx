import { useEffect, useState } from "react";
import Layout from "../Components/Layout";
import "./Style/Favorites.css";
import axios from 'axios';
import { useUser } from "../Context/UserContext";
import Loader from "../Components/Loader";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router";
import { Rating } from 'react-simple-star-rating';
import Popup from "../Components/Popup.jsx";  // Import the Popup component

export default function Recipe() {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useUser();
    const [rating, setRating] = useState(0);
    const [isPopupOpen, setIsPopupOpen] = useState(false); // To control the popup visibility
    const [selectedMeal, setSelectedMeal] = useState(null); // To store selected meal for rating
    const navigate = useNavigate();

    useEffect(() => {
        fetchFavorite();
    }, []);

    console.log("user", user);
    

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
            setFavorites(mealsWithRatings); // Set the meals with their respective average ratings
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

    const handleRateMeal = async (meal) => {
        setSelectedMeal(meal); // Set the selected meal for rating
        setIsPopupOpen(true); // Show the popup

        // Fetch the user's rating if available for this meal
        const userRating = await fetchUserRating(meal.idMeal);
        setRating(userRating); // Set the user's rating in the state
    };

    const handleSubmitRating = async () => {
        try {
            await axios.post('http://192.168.1.185:8800/rate', {
                user_id: user.id,
                meal_id: selectedMeal.idMeal,
                rating: rating,
            });

            setIsPopupOpen(false); // Close the popup after submitting the rating
            fetchFavorite(); // Refresh the favorite meals list to reflect any changes
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <>
            <Layout>
                <div className="fav__layout">
                    <h2>Favorites</h2>

                    {loading ? (
                        <div className="loader">
                            <Loader />
                        </div>
                    ) : (
                        favorites.length > 0 ? (
                            <div className="favorite__list">
                               {favorites.map((meal, index) => (
                                    <div key={index} className="meal__item">
                                        <div className="meal__name">{meal.strMeal}</div>

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
                                               
                                                <button  
                                                    onClick={() => handleRateMeal(meal)}
                                                    >RATE
                                                </button>
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
                                <button>ADD <FaPlus /></button>
                            </>
                        )
                    )}
                </div>

                <Popup trigger={isPopupOpen} setTrigger={setIsPopupOpen}>
                    <h4>Rate this Recipe ( 1 to 5 star )</h4>
                    <div className="rating__popup">
                        <Rating
                            onClick={(rate) => setRating(rate)}
                            initialValue={rating}
                            className="rate"
                        />
                        <button onClick={handleSubmitRating}>Submit Rating</button>
                    </div>
                </Popup>
            </Layout>
        </>
    );
};
