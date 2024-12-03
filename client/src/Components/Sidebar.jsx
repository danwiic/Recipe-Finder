import { useState } from "react";
import { NavLink } from "react-router-dom"
import "./Style/Sidebar.css"
import { RiDashboardHorizontalLine } from "react-icons/ri";
import { GrUserManager } from "react-icons/gr";
import { MdOutlinePendingActions } from "react-icons/md";





useState

export default function Sidebar({children}) {
    
    const [isActive, setActive] = useState(false);

    return(
    <div className="side">
        <div className="sidebar__layout">
            <div className={`nav__links ${isActive ? 'active' : ''}`}>
                    <NavLink
                    to='/dashboard/overview'
                    className={({ isActive }) => `nav__list ${isActive ? 'active' : ''}`}
                    >
                    <div className="nav__text"><RiDashboardHorizontalLine /> Overview</div>
                    </NavLink>

                    <NavLink
                    to='/dashboard/manage'
                    className={({ isActive }) => `nav__list ${isActive ? 'active' : ''}`}
                    >
                    <div className="nav__text"><GrUserManager /> Manage Users</div>
                    </NavLink>


                    <NavLink
                    to='/dashboard/pending'
                    className={({ isActive }) => `nav__list ${isActive ? 'active' : ''}`}
                    >
                    <div className="nav__text"><MdOutlinePendingActions /> Pending Recipes</div>
                    </NavLink>

            </div>
        </div>
        {children}
    </div>
    )
};
