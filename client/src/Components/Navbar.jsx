import React, { useState } from 'react';
import { GiRadarSweep } from "react-icons/gi";
import { NavLink, useNavigate, Link } from "react-router-dom";
import './Style/Navbar.css';
import { useUser } from '../Context/UserContext'; // Use context to check login state
import axios from 'axios';
import Popup from "../Components/PopupS";
import { FaRegQuestionCircle } from "react-icons/fa";


export default function Navbar({}) {
  const [isActive, setActive] = useState(false);
  const { user, setUser } = useUser(); // Use user context to check if user is logged in
  const [open, setOpen] = useState(false);
  const navigate = useNavigate(); // Move navigate here to the top level

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

  const toLogout = async () => {
    try {
      const res = await axios.post("http://192.168.1.185:8800/logout");

      if (res.status === 200) {
        // Clear the user from the context and localStorage
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");

        // Reset user context if you're using context API
        setUser(null);
        setOpen(false)

        // Redirect to home page
        navigate("/"); 
      }
    } catch (error) {
      console.error("Logout failed", error);
    }
  }

  return (
    <div className='navbar__container__parent'>
      <div className="navbar__container" style={isLoginPage ? myStyle : {}}>
        <div className="logo">
          <Link to='/'><
            GiRadarSweep />
             RecipeRadar
          </Link>
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
            <button 
              className="btn__goToLogin"
              onClick={() => setOpen(true)}
            >
              LOGOUT
            </button>
          )
        )}

        {open && (
          <Popup trigger={open}>
            <div className="confirmation__container">
              <h3><FaRegQuestionCircle />Logout Confirmation</h3>
              <p>Are you sure you want to logout?</p>

              <div className="confirmation">
                <button className='btn__confirm' onClick={toLogout}>CONFIRM</button>
                <button className='btn__cancel' onClick={() => setOpen(false)}>CANCEL</button>
              </div>
            </div>
          </Popup>
        )}
        
      </div>
      
    </div>
  );
}
