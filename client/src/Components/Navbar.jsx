import React, { useState } from 'react';
import { GiRadarSweep } from "react-icons/gi";
import { NavLink } from "react-router-dom";
import './Style/Navbar.css';
import { useUser } from '../Context/UserContext'; // Use context to check login state
import axios from 'axios';

export default function Navbar({ children }) {
  const [isActive, setActive] = useState(false);
  const { user, setUser } = useUser();  // Use user context to check if user is logged in

  const navBar = [
    { path: '/', name: "HOME" },
    { path: '/favorites', name: "FAVORITES" },
    { path: '/planner', name: "PLANNER" },
  ];

  const isLoginPage = location.pathname === '/login' || location.pathname === '/signup';

  const myStyle = {
    display: "none",
    backgroundColor: "none",
  };

  const toLogout = async (e) => {
    e.preventDefault(); // Prevent the default button behavior (like form submit)
  
    try {
      // Make a request to the logout endpoint
      const res = await axios.post("http://192.168.1.185:8800/logout");
  
      if (res.status === 200) {
        // Clear the user from the context and localStorage
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
  
        // Optionally, reset the user context if you're using context API
        setUser(null);
        setAccessToken(null);
  
        // Redirect to login page (or home page, depending on your design)
        navigate("/login"); 
      }
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <>
      <div className="navbar__container" style={isLoginPage ? myStyle : {}}>
        <div className="logo">
          <GiRadarSweep />
          RecipeRadar
        </div>

        <div className={`nav__links ${isActive ? 'active' : ''}`}>
          {navBar.map((nav, index) => (
            <NavLink
              to={nav.path}
              key={index}
              className={({ isActive }) => `nav__list ${isActive ? 'active' : ''}`}
            >
              <div className="nav__text">{nav.name}</div>
            </NavLink>
          ))}
        </div>

        {/* Conditionally render login button */}
        {!isLoginPage && (
          !user ? (
            <NavLink to="/login">
              <button className="btn__goToLogin">LOGIN</button>
            </NavLink>
          ) : (
            <NavLink to="/login">
              <button 
                className="btn__goToLogin"
                onClick={toLogout}
              >LOGOUT</button>
            </NavLink>
          )
        )}

      </div>
      {children}
    </>
  );
}
