import { BrowserRouter as Router, Routes, Route, BrowserRouter } from "react-router-dom"
import Landing from "./Page/Landing"
import Planner from "./Page/Planner"
import Favorites from "./Page/Favorites.jsx"
import Login from "./Page/Login.jsx"
import Signup from "./Page/Signup.jsx"

export default function App() {
  return(
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing/>} />
          <Route path="/favorites" element={<Favorites/>} />
          <Route path="/planner" element={<Planner/>} />
          <Route path='/login' element={<Login/>}/> 
          <Route path='/signup' element={<Signup/>}/> 
        </Routes>
      </BrowserRouter>
    </>
  )
};
