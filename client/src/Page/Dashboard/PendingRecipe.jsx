import { useEffect, useState } from "react";
import Loader from "../../Components/Loader";
import Sidebar from "../../Components/Sidebar"
import "./Style/Pending.css"
import { useUser } from "../../Context/UserContext";
import axios from "axios";
import { FaCheck } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";



axios
useUser
Loader

export default function PendingRecipe() {
    const [loading, setLoading] = useState(false);
    const [pendingRecipe, setPendingRecipe] = useState([])
    const {user} = useUser()


    const fetchPending = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`http://192.168.1.185:8800/pending`);
            const pending = res.data
            console.log(pending);
            

            setPendingRecipe(pending); // Set the meals with their respective average ratings
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveMeal = async (id) => {
        try{

            const res = await axios.post(`http://192.168.1.185:8800/pending/approve/${id}`)

            if(res.status === 201){
                fetchPending()
            }

        }catch(err){
            console.log(err);
        }
    }

    const handleRejectMeal = async (id) => {
        try{

            const res = await axios.delete(`http://192.168.1.185:8800/pending/reject/${id}`)

            if(res.status === 201){
                fetchPending()
            }

        }catch(err){
            console.log(err);
        }
    }

    useEffect(() => {
        fetchPending()
    }, [])

    return(
        <div>
            <Sidebar>
                <div className="pending__con">
                    <h3>Pending Recipes</h3>


                    <div className="pending__layout">

                    {loading ? (
                        <div className="loader">
                            <Loader />
                        </div>
                    ) : (
                        pendingRecipe.length > 0 ? (
                            <div className="favorite__list">
                               {pendingRecipe.map((meal, index) => (
                                    <div key={index} className="meal__item">
                                        <div className="meal__name">{meal.strMeal.toUpperCase()}</div>

                                        <div className="meal__item__layout">
                                           <div className="img__con">
                                                <img src={meal.strMealThumb} alt={meal.strMeal} />
                                           </div>

                                                <div className="ratings">
                                                    <button 
                                                        className="btn__reject" 
                                                        onClick={() => handleRejectMeal(meal.id)}
                                                        ><FaXmark />REJECT
                                                    </button>
                                                
                                                    <button 
                                                        className="btn__approve" 
                                                        onClick={() => handleApproveMeal(meal.id)}
                                                        ><FaCheck />APPROVE
                                                    </button>
                                                </div>

                                                <div className="action">
                                                    <button 
                                                        className="btn__view"
                                                        // onClick={() => handleViewRecipe(meal)}
                                                    >VIEW RECIPE
                                                    </button>
                                                </div>
                                        </div>
                                    </div>
                                ))}

                            </div>
                        ) : (
                            <>
                                <p>No pending recipes yet!</p>
                            </>
                        )
                    )}
                </div>
                    
                </div>
            </Sidebar>
        </div>
    )
};
