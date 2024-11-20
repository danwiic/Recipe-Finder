import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./Page/Landing";
import Meals from "./Page/Meals";
import Favorites from "./Page/Favorites.jsx";
import Login from "./Page/Login.jsx";
import Signup from "./Page/Signup.jsx";
import { UserProvider } from "./Context/UserContext.jsx";
import ProtectedRoute from "./Components/ProtectedRoute.jsx";
import MealDetail from "./Page/RecipeDetail.jsx";
import Dashboard from "./Page/Dashboard.jsx";
import Data from './Page/Dashboard/Data.jsx'
import PendingRecipe from './Page/Dashboard/PendingRecipe.jsx'
import ManageUsers from './Page/Dashboard/ManageUsers.jsx'

export default function App() {
  return (
    <>
      <UserProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            

            <Route 
              path="/home" 
              element={ 
              <ProtectedRoute allowedRoles={['admin', 'user']}>
                  <Landing />
                </ProtectedRoute>
              } />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            > 
              <Route path="/dashboard/overview" element={<Data/>} />
              <Route path="/dashboard/manage" element={<ManageUsers/>} />
              <Route path="/dashboard/pending" element={<PendingRecipe/>} />
            </Route>


            <Route
              path="/recipe/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'user']}>
                  <MealDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/favorites"
              element={
                <ProtectedRoute allowedRoles={['admin', 'user']}>
                  <Favorites />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meals"
              element={
                <ProtectedRoute allowedRoles={['admin', 'user']}>
                  <Meals />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </UserProvider>
    </>
  );
}
