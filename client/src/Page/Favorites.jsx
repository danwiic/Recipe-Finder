import { useEffect, useState } from "react";
import Layout from "../Components/Layout";
import "./Style/Favorites.css"
import axios from 'axios'
import { useUser } from "../Context/UserContext";
import Loader from "../Components/Loader";
import bg from "/fav_bg.jpg"
import { IoStar } from "react-icons/io5"
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router";
useNavigate

export default function Recipe() {
    const [favorites, setFavorites] = useState([])
    const [loading, setLoading] = useState(false)
    const { user } = useUser()
    const navigate = useNavigate();

    useEffect(() => {
        fetchFavorite()
    }, [])

    const fetchFavorite = async () => {
        try{
            setLoading(true)
            const res = await axios.get(`http://192.168.1.185:8800/favorites/${user.id}`)
            setFavorites(res.data.meals) 
        }catch(error){
            console.error(error);
        }finally{
            setLoading(false)
        }
    }

    const handleViewRecipe = (recipe) => {
        navigate(`/recipe/${recipe.idMeal}`);
    }
    

    return(
        <>
        <Layout>
            <div className="fav__layout" style={{backgroundColor: "#FCFAEE"}}>
                <h2>FAVORITES</h2>

                {loading ? (
                    <div className="loader">
                        <Loader/>
                    </div>
                ) : (
                    favorites.length > 0 ? (
                        <div className="favorite__list">
                            {favorites.map((meal, index) => (
                                <>
                                    <div key={index} className="meal__item">
                                        <div className="meal__name">{meal.strMeal}</div>

                                        <div className="meal__item__layout">
                                            <img src={meal.strMealThumb} alt={meal.strMeal} />

                                            <div className="ratings">
                                                <span className="show__ratings">RATINGS: </span>
                                            </div>

                                            <div className="action">
                                                <button 
                                                    className="btn__view"
                                                    onClick={(e) => handleViewRecipe(meal)}
                                                    >
                                                    VIEW RECIPE
                                                </button>
                                                <button className="btn__review"><IoStar/></button>
                                            </div>
                                        </div>
                                    </div>
                                </>
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
        </Layout>
        </>
    )
};