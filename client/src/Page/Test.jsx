import { useState } from "react";
import axios from "axios";

export default function AddMeal() {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMealData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://192.168.1.185:8800/meals", {
        ...mealData,
        ingredients: mealData.ingredients.map(ing => ing.ingredient),
        measurements: mealData.ingredients.map(ing => ing.measurement)
      });
      setMessage(res.data.message);
    } catch (error) {
      setMessage("Failed to add meal.");
    }
  };

  return (
    <div>
      <h2>Add a New Meal</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <input type="text" name="strMeal" placeholder="Meal Name" value={mealData.strMeal} onChange={handleInputChange} required />
        <input type="text" name="strCategory" placeholder="Category" value={mealData.strCategory} onChange={handleInputChange} required />
        <input type="text" name="strArea" placeholder="Area" value={mealData.strArea} onChange={handleInputChange} required />
        <textarea name="strInstructions" placeholder="Instructions" value={mealData.strInstructions} onChange={handleInputChange} required />
        <input type="text" name="strMealThumb" placeholder="Thumbnail URL" value={mealData.strMealThumb} onChange={handleInputChange} />
        <input type="text" name="strTags" placeholder="Tags (comma-separated)" value={mealData.strTags} onChange={handleInputChange} />
        <input type="text" name="strYoutube" placeholder="YouTube Link" value={mealData.strYoutube} onChange={handleInputChange} />

        <h4>Ingredients and Measurements</h4>
        {mealData.ingredients.map((ing, index) => (
          <div key={index} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <input
              type="text"
              placeholder="Ingredient"
              value={ing.ingredient}
              onChange={(e) => handleIngredientChange(index, "ingredient", e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Measurement"
              value={ing.measurement}
              onChange={(e) => handleIngredientChange(index, "measurement", e.target.value)}
              required
            />
            {mealData.ingredients.length > 1 && (
              <button type="button" onClick={() => handleRemoveIngredient(index)}>
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={handleAddIngredient}>Add Ingredient</button>

        <button type="submit">Add Meal</button>
      </form>
    </div>
  );
}
