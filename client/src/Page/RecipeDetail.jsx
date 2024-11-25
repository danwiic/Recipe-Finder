import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactPlayer from 'react-player/youtube'
import './Style/RecipeDetail.css'
import axios from 'axios'
import Loader from '../Components/Loader'
import { MdArrowBack } from "react-icons/md"
import { IoStar } from "react-icons/io5"
import { useUser } from "../Context/UserContext" 
import Layout from '../Components/Layout.jsx'
import Popup from '../Components/Popup.jsx'
import { Rating } from 'react-simple-star-rating';
import { LiaCommentSolid } from "react-icons/lia";
import { MdReport } from "react-icons/md";
import { MdDeleteOutline } from "react-icons/md";
import { IoIosRemoveCircle } from "react-icons/io";
import { IoMdAdd } from "react-icons/io";
import { TiDeleteOutline } from "react-icons/ti";
import { MdDeleteForever } from "react-icons/md";


Popup

export default function MealDetail() {
  const { id } = useParams()
  const { user } = useUser() // To get user data, such as ID
  const [meal, setMeal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [nutrition, setNutrition] = useState(null)
  const [isFavorite, setIsFavorite] = useState(false) // To track if the meal is in favorites
  const [ratingData, setRatingData] = useState({ 
    averageRating: 0, 
    ratingCount: 0
  })
  const [rating, setRating] = useState(0);  // Initialize rating with 0
  const [isOpen, setOpen] = useState(false); 
  const [viewComment, setViewComment] = useState(false)
  const [comments, setComments] = useState(null)
  const [addComment, setAddComment] = useState('')
  const [showDeletePromt, setShowDeletePromo] = useState(false)
  const [selectedComment, setSelectedComment] = useState(null)
  const [deleteMeal, setDeleteMeal] = useState(false)
  const navigate = useNavigate()
  
  console.log(ratingData);

  const deleteSelectedMeal = async () => {
    try{
      const res = await axios.delete(`http://192.168.1.185:8800/meals/${id}`)

      if(res.status === 200){
        navigate("/home")
      }
    }catch(err){
      console.log(err);
    }
  }

  const deleteComment = async (commentId) => {
    try{
      const res = await axios.delete(`http://192.168.1.185:8800/meals/${id}/comments/${commentId}`)
      if(res.status === 200){
        fetchComments()
        setShowDeletePromo(false)
      }
    }catch(err){
      console.log(err);
    }
  }

  const submitComment = async () => {
    try{
      const res = await axios.post(`http://192.168.1.185:8800/meals/${id}/comments`, {
        comment_text: addComment,
        user_id: user.id
      })
      if(res.status === 201){
        setAddComment("")
        fetchComments()
      }


    }catch(err){
      console.log("Error submitting comment: ", err);
      
    }
  }

  const fetchComments = async () => {
    try{
      const res = await axios.get(`http://192.168.1.185:8800/meals/${id}/comments`)
      console.log("comments:",  res);
      setComments(res.data)
    }catch(err){
      console.log(err);
    }
  }

  
  useEffect(() => {
    const fetchMealDetails = async () => {
      try {
        // First, check if the meal exists in TheMealDB API
        const { data } = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
        
        if (data.meals && data.meals.length > 0) {
          // If found in TheMealDB, use that data
          const mealData = data.meals[0];
          setMeal(mealData);
          fetchNutrition(mealData);
        } else {
          // If not found in TheMealDB, check the custom database
          const customApiResponse = await axios.get(`http://192.168.1.185:8800/meal/${id}`);
          console.log(customApiResponse);
          
          if (customApiResponse.data) {
            const customMealData = customApiResponse.data;
            setMeal(customMealData);
            fetchNutrition(customMealData);
          } else {
            setError('Meal not found!');
          }
        }
      } catch (error) {
        setError('An error occurred while fetching the meal details.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchMealDetails();
    fetchRatingData();  // Call fetchRatingData to load ratings data
    fetchComments()
    
  }, [id]);
  


  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        const response = await axios.get(`http://192.168.1.185:8800/favorites/${user.id}`);
        const mealIds = response.data.meals.map(meal => meal.idMeal);
        setIsFavorite(mealIds.includes(id));
      } catch (error) {
        console.error("Error checking favorite status:", error);
      }
    };
  
    if (user?.id) {
      checkFavoriteStatus();
    }
  }, [id, user]);

  const fetchNutrition = async (meal) => {
    let ingredients = []
    let measurements = []
  
    // Loop through ingredients and measurements
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`]
      const measurement = meal[`strMeasure${i}`]
  
      if (ingredient && ingredient.trim()) {
        ingredients.push(ingredient.trim())
        measurements.push(measurement || '1 unit') // Use a default measurement if null
      }
    }
  
    if (ingredients.length === 0 || measurements.length === 0) {
      if (meal.ingredients && meal.measurements) {
        try {
          ingredients = (meal.ingredients)
          measurements = (meal.measurements)
        } catch (error) {
          console.error("Error parsing custom API data:", error)
        }
      }
    }
  
    if (ingredients.length === 0 || measurements.length === 0) {
      console.error("Ingredients or measurements are missing.")
      setError("Ingredients or measurements are missing.")
      return
    }

    const ingredientList = []
    const ingredientRegex = /^[\d\.\,\/\*\+\-]*\s*(.*)$/

    for (let i = 0; i < ingredients.length; i++) {
      const ingredient = ingredients[i]
      let measure = measurements[i] || '1 unit'

      if (ingredient && ingredient.trim()) {
        let cleanedIngredient = ingredient.trim().replace(ingredientRegex, '$1').trim()
        cleanedIngredient = `${measure.trim()} ${cleanedIngredient}`
        ingredientList.push(cleanedIngredient)
      }
    }

    console.log("Final ingredient list:", ingredientList)

    if (ingredientList.length > 0) {
      try {
        const appId = '96466a93'
        const appKey = 'f7daa8c77175ac99ff5927068b289e6e'

        const response = await axios.post(
          `https://api.edamam.com/api/nutrition-details?app_id=${appId}&app_key=${appKey}`,
          { ingr: ingredientList },
          { headers: { 'Content-Type': 'application/json' } }
        )
        setNutrition(response.data)
      } catch (error) {
        console.error("Error fetching nutrition data:", error)
        setError('Could not fetch nutrition information.')
      }
    } else {
      console.error("No valid ingredients to send to Edamam.")
      setError("No valid ingredients to fetch nutrition.")
    }
  }

  const fetchRatingData = async () => {
    try {
      const response = await axios.get(`http://192.168.1.185:8800/ratings/average/${id}`);
      setRatingData(response.data);
    } catch (error) {
      console.error("Error fetching rating data:", error);
    }
  }

  useEffect(() => {
    fetchRatingData()
  }, [id])

  

  const handleAddToFavorites = async () => {
    try {
      console.log("Meal ID:", meal.idMeal); // Check if this is set properly
  
      const response = await axios.post('http://192.168.1.185:8800/favorites/add', {
        user_id: user.id,
        idMeal: meal.idMeal,  // Meal ID
      });
  
      if (response.data) {
        setIsFavorite(true); // Mark as favorite
        console.log("Favorite count updated:", response.data.favoriteCount);
      }
    } catch (error) {
      console.error("Error adding to favorites:", error);
    }
  };
  

  const handleRemoveFromFavorites = async () => {
    try {
      const response = await axios.post('http://192.168.1.185:8800/favorites/remove', {
        user_id: user.id,   // User ID
        idMeal: meal.idMeal, // Meal ID
      });
  
      if (response.data) {
        setIsFavorite(false); // Mark the meal as not a favorite
        // Optionally, update the favorite count in your component if needed
        console.log("Favorite count updated:", response.data.favoriteCount);
      }
    } catch (error) {
      console.error("Error removing from favorites:", error);
    }
  }
  

  if (loading) return <div className="loading"><Loader /></div>
  if (error) return <div>{error}</div>
  if (!meal) return <div>Meal not found!</div>


  const fetchUserRating = async (mealId) => {
    try {
      const response = await axios.get(`http://192.168.1.185:8800/ratings/user/${user.id}/meal/${mealId}`);
      return response.data.rating || 0;  // Default to 0 if no rating
    } catch (error) {
      console.error("Error fetching user rating:", error);
      return 0; // Return 0 if error occurs
    }
  };


  const handleSubmitRating = async () => {
    try {
        await axios.post('http://192.168.1.185:8800/rate', {
            user_id: user.id,
            meal_id: meal.idMeal,
            rating: rating,
        });
        fetchRatingData()
        setOpen(false)
    } catch (error) {
        console.error(error);
    }finally{
      setLoading(false)
    }
}

  const handleRateMeal = async (meal) => {
    setMeal(meal); // Set the selected meal for rating
    setOpen(true); // Show the popup

    // Fetch the user's rating if available for this meal
    const userRating = await fetchUserRating(meal.idMeal);
    setRating(userRating); // Set the user's rating in the state
  };

 


console.log(comments);



  return (
    <>
    <Layout>

      <div className="meal__detail__container">
        <div className="back__btn">
          <button className='btn__back' onClick={() => navigate(-1)}><MdArrowBack />BACK</button>
        </div>

        <h2 className='meal__name'>
          {meal.strMeal.toUpperCase()}
        </h2>


        <div className="meal__detail__layout">
          <div className="meal__video__container">

          

          <div className="vid__con">

          <div className="fav__action">
              <span className='rating__data'>({ratingData.averageRating.toFixed(1)} <IoStar /> || {ratingData.ratingCount} Reviews)</span>
                <div className="buttons">

                  {user && user.role === 'admin' &&(
                    <button
                      className='btn__delete'
                      onClick={(e) => {setDeleteMeal(true)}}
                    >
                      <MdDeleteForever />DELETE
                    </button>
                  )}

                  <button 
                    onClick={(e) => setViewComment(true)}
                    className='btn__comment'
                      ><LiaCommentSolid /> COMMENTS
                  </button>

                  {user && (
                     <button 
                     className='btn__rate' 
                     onClick={() => handleRateMeal(meal)}
                     > RATE THE MEAL
                   </button>
                   )}

                  {user && (
                    isFavorite ? (
                      <button className='fav__btn remove' onClick={handleRemoveFromFavorites}><IoIosRemoveCircle />REMOVE FROM FAVORITES</button>
                    ) : (
                      <button className='fav__btn' onClick={handleAddToFavorites}><IoMdAdd /> ADD TO FAVORITES</button>
                    )
                  )}
                </div>
            </div>


            

            <div className="meal__video ">
              <ReactPlayer 
                url={meal.strYoutube} 
                width="100%"
                height="400px"
              />
            </div>

            <div className='ingredients__container '>
              <h3>Ingredients</h3>
              <ul>
                {[...Array(20)].map((_, index) => {
                  const ingredient = meal[`strIngredient${index + 1}`]
                  const measure = meal[`strMeasure${index + 1}`] || '1 unit'
                  if (ingredient) {
                    return (
                      <li key={index}>
                        <span className='recipe__measurement'>
                          {measure.trim()}
                        </span> - {ingredient}
                      </li>
                    )
                  } else return null
                })}
              </ul>
            </div>

            {nutrition && (
                <div className='meal__nutrition '>
                  <h3>Nutrition Facts</h3>
                  <div className="meal__con">
                    <div>Calories: <span className='nutrition__details'>{nutrition.calories}cal</span></div>
                    <div>Serving Size: <span className='nutrition__details'>{nutrition.yield}</span></div>
                    <div>Fat: <span className='nutrition__details'>{Math.round(nutrition.totalNutrients.FAT.quantity)}g</span></div>
                    <div>Carbs: <span className='nutrition__details'>{Math.round(nutrition.totalNutrients.CHOCDF.quantity)}g</span></div>
                    <div>Protein: <span className='nutrition__details'>{Math.round(nutrition.totalNutrients.PROCNT.quantity)}g</span></div>
                  </div>
                  
                </div>
            )}


          

            <div className="meal__description ">
                <h3>Instructions</h3>
                <ol>
                  {meal.strInstructions.split('. ').map((step, index) => (
                    <li key={index}>{step.trim()}</li>
                  ))}
                </ol>
              </div>

            


            </div>
          </div>
        </div>
      </div>
     

        {/* RATING POPUP */}
        <Popup trigger={isOpen} setTrigger={setOpen}>
         <h4>Rate this Recipe ( 1 to 5 star )</h4>
          <div className="rating__popup">
              <Rating
                  onClick={(rate) => setRating(rate)}
                  initialValue={rating}
                  className="rate"
              />
              <button className="btn__submit_rate" onClick={handleSubmitRating}>SUBMIT RATING</button>
          </div>
      </Popup>

      {/* COMMENT POPUP */}
      <Popup trigger={viewComment} setTrigger={setViewComment}>
        <h4>COMMENTS</h4>
        <div className="comment__layout">
          {comments && comments.length > 0 ? (
            <div className='comment__con'>
          {  comments.map((comment, index) => (
             
             <div className="comment">
               <span className='title'>By: {comment.username} 
                  {user.role ==='admin' && (
                    <MdDeleteOutline onClick={(e) => {
                      setShowDeletePromo(prev => !prev)
                      setSelectedComment(comment.comment_id)
                    }
                    } />
                  )}
               </span>
               <div className='comments' key={index}>{comment.comment_text}<MdReport /></div>
             </div>
       
       ))}
            </div> 
          ) : (
            <div className="comments">No comments yet. Be the first to comment!</div>
          )}
          <form onSubmit={(e) => 
              {e.preventDefault() 
              submitComment()
            }}>
            <input 
              type="text"
              value={addComment}
              onChange={(e) => setAddComment(e.target.value)}
              placeholder='Write a comment...'
               />
            <button><LiaCommentSolid /></button>
          </form>
        </div>
      </Popup>
      


            {/* CONFIRMATION FOR DELETING COMMENT */}
      <Popup trigger={showDeletePromt} setTrigger={setShowDeletePromo}>
          <div className="delete__comment__popup">
             <TiDeleteOutline />
             <h3>Are you sure?</h3>
             <p>Do you really want to delete this comment?</p>

             <div className="action">
                <button 
                  onClick={(e) => setShowDeletePromo(prev => !prev)}
                  className='btn__cancel'
                  >Cancel</button>
                <button 
                  onClick={(e) =>  deleteComment(selectedComment)}
                  className='btn__delete'
                  >Delete</button>
             </div>
          </div>
      </Popup>

            {/* POPUP CONFIRMATION FOR DELETING A MEAL */}
      <Popup trigger={deleteMeal} setTrigger={setDeleteMeal}>
          <div className="delete__comment__popup">
             <TiDeleteOutline />
             <h3>Are you sure?</h3>
             <p>Do you really want to delete this meal?</p>

             <div className="action">
                <button 
                  onClick={(e) => setDeleteMeal(prev => !prev)}
                  className='btn__cancel'
                  >Cancel</button>
                <button 
                  onClick={(e) =>  deleteSelectedMeal(id)}
                  className='btn__delete'
                  >Delete</button>
             </div>
          </div>
      </Popup>

    </Layout>
    </>
  )
}
