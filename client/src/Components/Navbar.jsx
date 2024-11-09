import React, { useState } from 'react';
import { BiSolidFoodMenu } from "react-icons/bi";
import { GiHamburgerMenu } from "react-icons/gi";
import { NavLink } from "react-router-dom";
import './Style/Navbar.css';

export default function Navbar({children}) {
  const [isActive, setActive] = useState(false);

  const navBar = [
    { path: '/', name: "HOME" },
    { path: '/recipe', name: "MY RECIPE" },
    { path: '/planner', name: "MEAL PLANNER" },
  ];

  const toggleMobileMenu = () => {
    setActive(!isActive);
  }

  const isLoginPage = location.pathname === '/login' || location.pathname === '/signup'


  const myStyle = {
    display: "none",
    backgroundColor: "none",
  }
  
  return (
   <>
     <div className="navbar__container" style={isLoginPage ? myStyle : {} }>

      <div className="logo">
        <BiSolidFoodMenu />
        Meal Recipe
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

      {!isLoginPage && (
      <NavLink to="/login">
        <button className="btn__goToLogin">LOGIN</button>
      </NavLink>
      )}

      </div>
    {children}
   </>
  );
}
