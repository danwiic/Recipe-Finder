import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../Components/Layout";
import Popup from "../Components/Popup";
import "./Style/Meals.css";
import { useUser } from "../Context/UserContext";
import { Rating } from "react-simple-star-rating";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";
import Loader from "../Components/Loader";
import { FaTrashAlt } from "react-icons/fa";

export default function Meals() {
  const { user } = useUser();
  const [mealData, setMealData] = useState({
    strMeal: "",
    category_id: "",
    strArea: "",
    strInstructions: "",
    strMealThumb: "",
    strYoutube: "",
    ingredients: [""],
    user_id: user.id,
  });

  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);
  const navigate = useNavigate();

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`http://192.168.1.185:8800/categories`);
      setCategories(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // Submit the meal data for admin or review purposes
  const handleSubmitToReview = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://192.168.1.185:8800/pending/add", {
        ...mealData,
        ingredients: mealData.ingredients,
      });

      setMessage(res.data.message);
      resetMealForm();
    } catch (error) {
      setMessage("Failed to add meal.");
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`http://192.168.1.185:8800/meals`, {
        ...mealData,
        ingredients: mealData.ingredients,
      });

      setMessage(res.data.message);
      resetMealForm();
      fetchAddedMeal();
    } catch (error) {
      setMessage("Failed to add meal.");
      console.error(error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
  
    setMealData((prevData) => ({
      ...prevData,
      [name]: value,
      ...(name === "category_id" && value === "newCategory" ? { newCategory: "" } : {}),
    }));
  };

  // Handle ingredient input changes
  const handleIngredientChange = (index, value) => {
    const updatedIngredients = [...mealData.ingredients];
    updatedIngredients[index] = value; // Update the specific ingredient value
    setMealData((prevData) => ({
      ...prevData,
      ingredients: updatedIngredients
    }));
  };

  const handleAddIngredient = () => {
    setMealData((prevData) => ({
      ...prevData,
      ingredients: [...prevData.ingredients, ""]
    }));
  };

  const handleRemoveIngredient = (index) => {
    const updatedIngredients = mealData.ingredients.filter((_, idx) => idx !== index);
    setMealData((prevData) => ({
      ...prevData,
      ingredients: updatedIngredients
    }));
  };

  const resetMealForm = () => {
    setMealData({
      strMeal: "",
      category_id: "",
      strArea: "",
      strInstructions: "",
      strMealThumb: "",
      strYoutube: "",
      ingredients: [""],
      user_id: user.id,
    });
  };

  // Fetch added meals
  const fetchAddedMeal = async (page) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://192.168.1.185:8800/meals/user/${user.id}`, {
        params: {
          page: page,
          limit: pageSize,
        },
      });
      setAdded(res.data.meals);
      setTotalPages(res.data.totalPages);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    fetchAddedMeal(pageNumber);
  };

  useEffect(() => {
    fetchCategories();
    fetchAddedMeal(currentPage);
  }, [currentPage]);

  return (
    <Layout>
      <div className="meals__layout">
        <div className="meals__list">
          {added && added.length > 0 ? (
            <div className="top__meal" style={{marginTop: "0px"}}>
              <div className="header__action">
                <h3>RECIPES YOU ADDED</h3>
                <button onClick={() => setOpen(true)} className="btn__add">ADD MEAL</button>
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
                        loading="lazy"
                      />
                    </div>
                    <div className="meal__name">{result.strMeal.toUpperCase()}</div>
                    <div className="content">
                      <div className="content__details">
                        <div className="meal__cat">Category: {result.category_name}</div>
                        {result.averageRating ? (
                          <span className="meal__rating">
                            {result.averageRating.toFixed(1)}
                            <Rating readonly initialValue={result.averageRating} className="rate" />
                            ({result.ratingCount})
                          </span>
                        ) : (
                          <span className="meal__rating">
                            0
                            <Rating readonly initialValue={0} className="rate" />
                            (0)
                          </span>
                        )}
                        <Link to={`/recipe/${result.idMeal}`}>
                          <button className="view__recipe">VIEW RECIPE</button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {loading && <div className="loading"><Loader/></div>}
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="page-button"
                >
                  Previous
                </button>

                <span className="current-page">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="page-button"
                >
                  Next
                </button>
              </div>
            </div>
          ) : (
            <div className="header__action nomeal">
              <h3>You haven't uploaded any meals yet.</h3>
              <button onClick={() => setOpen(true)} className="btn__add">ADD MEAL</button>
            </div>
          )}
        </div>
      </div>
      
      <Popup setTrigger={setOpen} trigger={open}>
        <div className="pop__con">
          <h3>ADD NEW MEAL</h3>
          {message && <p>{message}</p>}
          <form
            onSubmit={user.role === "admin" ? handleSubmit : handleSubmitToReview}
            className="add__container"
          >
            <label>Meal Name:</label>
            <input
              type="text"
              name="strMeal"
              value={mealData.strMeal}
              onChange={handleInputChange}
              autoComplete="off"
            />

            <div className="categories">
              <label htmlFor="category_id">Category: </label>
              <select
                id="category_id"
                name="category_id"
                value={mealData.category_id}
                style={{padding : "6px"}}
                onChange={(e) => {
                  const selectedCategory = e.target.value
                  setMealData((prevData) => ({
                    ...prevData,
                    category_id: selectedCategory,
                  }));
                }}
                required
              >
                <option value="" disabled>Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.category_name}
                  </option>
                ))}
                {user.role === 'admin' && <option value="newCategory">New Category</option>}
              </select>
              
              {mealData.category_id === "newCategory" && user.role === "admin" && (
  <div>
    <label htmlFor="newCategory">Add New Category</label>
    <input
      type="text"
      id="newCategory"
      name="newCategory"
      value={mealData.newCategory || ""}
      onChange={handleInputChange}
      placeholder="New Category"
      required
    />
  </div>
)}
            </div>

            <div>
              <label htmlFor="strArea">Area</label>
              <input
                type="text"
                id="strArea"
                name="strArea"
                placeholder="Area (e.g. American)"
                value={mealData.strArea}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="strInstructions">Instructions</label>
              <textarea
                id="strInstructions"
                name="strInstructions"
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
                required
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
                required
              />
            </div>

            <h4>Ingredients and Measurements (Metric System)</h4>
            <button type="button" onClick={handleAddIngredient} className="btn__add_row">ADD ROW</button>

            {mealData.ingredients.map((ing, index) => (
              <div key={index} >
                  <label htmlFor={`ingredient-${index}`}>Ingredient</label>
                <div style={{ display: "flex", gap: "10px", marginBottom: "10px", alignItems: "center" }}>
                  <input
                    id={`ingredient-${index}`}
                    type="text"
                    placeholder={`Ingredient ${index + 1}`}
                    value={ing}
                    onChange={(e) => handleIngredientChange(index, e.target.value)}
                    required
                  />
                  {mealData.ingredients.length > 1 && (
                  <button className="btn__remove" type="button" onClick={() => handleRemoveIngredient(index)}>
                    <FaTrashAlt />
                  </button>
                )}
                </div>
                
              </div>
            ))}

             <button type="submit">{user.role === "admin" ? "Submit" : "Submit for review"}</button>
          </form>
        </div>
      </Popup>
    </Layout>
  );
}
