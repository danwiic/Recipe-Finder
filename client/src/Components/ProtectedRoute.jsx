import { Navigate, useLocation, Link } from "react-router-dom";
import { useUser } from "../Context/UserContext";
import { useState, useEffect } from "react";
import Popup from "./PopupS.jsx";
import { CgUnavailable } from "react-icons/cg";
import "./Style/ProtectedRoute.css"


const ProtectedRoute = ({ children }) => {
  const { user } = useUser();
  const location = useLocation();

  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!user) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }, [user]);

  if (!user) {
    return (
      <>
       <Popup
        trigger={open} 
        >
        <Link to="/">
          <button className="popup__button">BACK TO HOMEPAGE</button>
        </Link>

        <div className="protected__popup">
          <div className="message">
            <CgUnavailable /> <h3>Oops, You're not authorized to access this page!</h3>
          </div>

          <div className="content">
            You must login first to access this page.
          </div>

          <div className="to__login">
            <Link to="/login">
              <button className="popup__button">LOGIN HERE</button>
            </Link>
          </div>
        </div>

       </Popup>
        
      </>
    );
  }

  return children;
};

export default ProtectedRoute;
