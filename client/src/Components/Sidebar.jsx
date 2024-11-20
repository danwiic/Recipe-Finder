import { useState } from "react";
import { NavLink } from "react-router-dom"
import "./Style/Sidebar.css"
useState

export default function Sidebar({children}) {
    const [isActive, setActive] = useState(false);

    const sideBar = [
        {path : "/dashboard/overview", name: "OVERVIEW"},
        {path : "/dashboard/manage", name: "MANAGE USERS"},
        {path : "/dashboard/pending", name: "PENDING RECIPE"},
    ]

    return(
    <div className="side">
        <div className="sidebar__layout">
            <div className={`nav__links ${isActive ? 'active' : ''}`}>
                {sideBar.map((nav, index) => (
                    <NavLink
                    to={nav.path}
                    key={index}
                    className={({ isActive }) => `nav__list ${isActive ? 'active' : ''}`}
                    >
                    <div className="nav__text">{nav.name}</div>
                    </NavLink>
                ))}
            </div>
        </div>
        {children}
    </div>
    )
};
