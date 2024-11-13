import { BrowserRouter as Router, Routes, Route, BrowserRouter } from "react-router-dom"
import Landing from "./Page/Landing"
import Planner from "./Page/Planner"
import Favorites from "./Page/Favorites.jsx"
import Login from "./Page/Login.jsx"
import Signup from "./Page/Signup.jsx"
import { UserProvider } from "./Context/UserContext.jsx"
import ProtectedRoute from "./Components/ProtectedRoute.jsx"
import MealDetail from "./Page/RecipeDetail.jsx"
import Test from './Page/Test.jsx'
export default function App() {
  return(
    <>
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing/>} />
          <Route path="/test" element={<Test/>} />

          <Route path="/recipe/:id" element={<MealDetail />} />
          <Route path="/favorites" element={ 
            <ProtectedRoute>
            <Favorites />
          </ProtectedRoute>} />

          <Route path="/planner" element={ <ProtectedRoute>
            <Planner />
          </ProtectedRoute>} />
          <Route path='/login' element={<Login/>}/> 
          <Route path='/signup' element={<Signup/>}/> 
        </Routes>
      </BrowserRouter>
    </UserProvider>
    </>
  )
};
