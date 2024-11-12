import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactPlayer from 'react-player/youtube'
import './Style/RecipeDetail.css'
import axios from 'axios'
import Loader from '../Components/Loader'
import { MdArrowBack } from "react-icons/md"
import { IoStar } from "react-icons/io5"

export default function MealDetail() {
  const { id } = useParams()
  const [meal, setMeal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [nutrition, setNutrition] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchMealDetails = async () => {
      try {
        const { data } = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`)
        
        if (data.meals && data.meals.length > 0) {
          const mealData = data.meals[0]
          setMeal(mealData)
          fetchNutrition(mealData)
        } else {
          const customApiResponse = await axios.get(`http://192.168.1.185:8800/meal/${id}`)
          if (customApiResponse.data && customApiResponse.data.meal) {
            const customMealData = customApiResponse.data.meal
            setMeal(customMealData)

            if (customMealData.nutrition) {
              setNutrition(customMealData.nutrition)
            } else {
              fetchNutrition(customMealData)
            }
          } else {
            setError('Meal not found!')
          }
        }
      } catch (error) {
        setError('An error occurred while fetching the meal details.')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchMealDetails()
  }, [id])

  const fetchNutrition = async (meal) => {
    let ingredients = []
    let measurements = []

    if (meal.strIngredient1) {
      for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`]
        const measurement = meal[`strMeasure${i}`]

        if (ingredient && ingredient.trim()) {
          ingredients.push(ingredient.trim())
          measurements.push(measurement || '1 unit')
        }
      }
    }

    if (ingredients.length === 0 || measurements.length === 0) {
      if (meal.ingredients && meal.measurements) {
        try {
          ingredients = JSON.parse(meal.ingredients)
          measurements = JSON.parse(meal.measurements)
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
        const appId = 'fcea78c3'
        const appKey = 'd4ac7d59db1dff270f38a92f6a4cc461'

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

  if (loading) return <div className="loading"><Loader /></div>
  if (error) return <div>{error}</div>
  if (!meal) return <div>Meal not found!</div>

  return (
    <>
      <div className="meal__detail__container">
        <div className="back__btn">
          <button className='btn__back' onClick={() => navigate(-1)}><MdArrowBack />BACK</button>
        </div>

        <h2 className='meal__name'>{meal.strMeal}</h2>

        <div className="meal__detail__layout">
          <div className="meal__video__container">
            <div className="meal__video">
              <ReactPlayer url={meal.strYoutube} />
            </div>
            {nutrition && (
              <div className='meal__nutrition'>
                <h3>Total Calories: {nutrition.calories}cal</h3>
                <h3>Serving Size: {nutrition.yield} people</h3>
                <h3>Calories per Serving: {Math.round(nutrition.calories / nutrition.yield)}cal</h3>
                <h3>Grams per Serving: {Math.round(nutrition.totalWeight / nutrition.yield)}g</h3>
                <button className='fav__btn'>
                  <IoStar />
                  ADD TO FAVORITES
                </button>
              </div>
            )}
          </div>

          <div className="meal__description">
            <h3>Instructions</h3>
            <ol>
              {meal.strInstructions.split('. ').map((step, index) => (
                <li key={index}>{step.trim()}</li>
              ))}
            </ol>

            <h3>Ingredients:</h3>
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
        </div>
      </div>
    </>
  )
}
