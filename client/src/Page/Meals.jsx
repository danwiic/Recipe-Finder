import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../Components/Layout";
import Popup from "../Components/Popup";
import "./Style/Meals.css"
import { useUser } from "../Context/UserContext";
import { FaTrash } from "react-icons/fa";
import { Rating } from 'react-simple-star-rating';
import { useNavigate } from "react-router";
useNavigate

useUser
Popup

export default function Meals() {
  const [mealData, setMealData] = useState({
    strMeal: "",
    strCategory: "",
    strArea: "",
    strInstructions: "",
    strMealThumb: "",
    strTags: "",
    strYoutube: "",
    ingredients: [{ ingredient: "", measurement: "" }],
    user_id: 1 // Replace with the actual user_id
  });
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false)
  const { user } = useUser()
  const [added, setAdded] = useState({})

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMealData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const navigate = useNavigate()
  

  const handleIngredientChange = (index, field, value) => {
    const updatedIngredients = mealData.ingredients.map((ing, idx) =>
      idx === index ? { ...ing, [field]: value } : ing
    );
    setMealData((prevData) => ({
      ...prevData,
      ingredients: updatedIngredients
    }));
  };

  const handleAddIngredient = () => {
    setMealData((prevData) => ({
      ...prevData,
      ingredients: [...prevData.ingredients, { ingredient: "", measurement: "" }]
    }));
  };

  const handleRemoveIngredient = (index) => {
    const updatedIngredients = mealData.ingredients.filter((_, idx) => idx !== index);
    setMealData((prevData) => ({
      ...prevData,
      ingredients: updatedIngredients
    }));
  };

  console.log("bow:",user.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
   

    try {
      const res = await axios.post("http://192.168.1.185:8800/meals", {
        ...mealData,
        ingredients: mealData.ingredients.map(ing => ing.ingredient),
        measurements: mealData.ingredients.map(ing => ing.measurement)
      });
      setMessage(res.data.message);
      
      
      setMealData({
        strMeal: "",
        strCategory: "",
        strArea: "",
        strInstructions: "",
        strMealThumb: "",
        strTags: "",
        strYoutube: "",
        ingredients: [{ ingredient: "", measurement: "" }],
        user_id: user.id
      });
    } catch (error) {
      setMessage("Failed to add meal.");
    }
  };

  const fetchAddedMeal = async () => {
    try {
      const meal = await axios.get(`http://192.168.1.185:8800/meals/user/${user.id}`);
      setAdded(meal.data.meals); 
      console.log("nya",meal.data.meals);
    } catch (err) {
      console.log(err);
    }finally{
      setOpen(false)
    }
  };

  useEffect(() => {
    fetchAddedMeal()
  }, [])

  const handleViewRecipe = (recipe) => {
    navigate(`/recipe/${recipe.idMeal}`);
};
  

  return (
    <Layout>
      <div className="meals__layout">
       

        <div className="meals__list">
        {added && added.length > 0 ? (
                <div className="top__meal">
                   <div className="header__action">
                      <h3>RECIPES YOU ADDED</h3>
                      <button
                        onClick={() => setOpen(true)}
                        className="btn__add"
                      >ADD MEAL</button>
                  </div>
                    <div className="meals">
                    {added.map((result) => (
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
                  <div className="header__action nomeal">
                    <h3>You haven't uploaded any meals yet.</h3>
                    <button
                      onClick={() => setOpen(true)}
                      className="btn__add"
                    >ADD MEAL</button>
                </div>
                )}
        </div>
      </div>
    <Popup 
     setTrigger={setOpen}
     trigger={open}
    >
      <div className="pop__con">
      <h3>ADD NEW MEAL</h3>

      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit} className="add__container">
        <div>
          <label htmlFor="strMeal">Meal Name</label>
          <input
            type="text"
            id="strMeal"
            name="strMeal"
            placeholder="Meal Name"
            value={mealData.strMeal}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label htmlFor="strCategory">Category</label>
          <input
            type="text"
            id="strCategory"
            name="strCategory"
            placeholder="Category"
            value={mealData.strCategory}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label htmlFor="strArea">Area</label>
          <input
            type="text"
            id="strArea"
            name="strArea"
            placeholder="Area"
            value={mealData.strArea}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="txtarea"> 
          <label htmlFor="strInstructions">Instructions</label>
          <textarea
            id="strInstructions"
            name="strInstructions"
            placeholder="Instructions"
            value={mealData.strInstructions}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label htmlFor="strMealThumb">Thumbnail URL</label>
          <input
            type="text"
            id="strMealThumb"
            name="strMealThumb"
            placeholder="Thumbnail URL"
            value={mealData.strMealThumb}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label htmlFor="strTags">Tags</label>
          <input
            type="text"
            id="strTags"
            name="strTags"
            placeholder="Tags (comma-separated)"
            value={mealData.strTags}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label htmlFor="strYoutube">YouTube Link</label>
          <input
            type="text"
            id="strYoutube"
            name="strYoutube"
            placeholder="YouTube Link"
            value={mealData.strYoutube}
            onChange={handleInputChange}
          />
        </div>

        <h4>Ingredients and Measurements (Metric System)</h4>

        <button 
          type="button" 
          onClick={handleAddIngredient}
          className="btn__add_row"
          >ADD ROW
        </button>
        {mealData.ingredients.map((ing, index) => (
          <div key={index} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <div>
              <label htmlFor={`ingredient-${index}`}>Ingredient</label>
              <input
                id={`ingredient-${index}`}
                type="text"
                placeholder={`Ingredient ${index + 1}`}
                value={ing.ingredient}
                onChange={(e) => handleIngredientChange(index, "ingredient", e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor={`measurement-${index}`}>Measurement</label>
              <input
                id={`measurement-${index}`}
                type="text"
                placeholder={`measurement ${index + 1}`}
                value={ing.measurement}
                onChange={(e) => handleIngredientChange(index, "measurement", e.target.value)}
                required
              />
            </div>
            {mealData.ingredients.length > 1 && (
              <button 
                className="btn__remove"
                type="button" onClick={() => handleRemoveIngredient(index)}>
                  <FaTrash /></button>
            )}
          </div>
        ))}
        

        <div className="btn_con">
          <button 
            type="submit" 
            className="btn__add_meal">ADD MEAL
          </button>
        </div>
      </form>
    </div>

    </Popup>
  
    </Layout>
  );
}
