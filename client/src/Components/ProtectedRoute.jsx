import { useNavigate, useLocation, Link } from "react-router-dom";
import { useUser } from "../Context/UserContext";
import { useState, useEffect } from "react";
import Popup from "./PopupS.jsx";
import { CgUnavailable } from "react-icons/cg";
import "./Style/ProtectedRoute.css";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Check if user exists and has the required role
  const hasAccess = user && allowedRoles.includes(user.role);

  useEffect(() => {
    if (!user) {
      setOpen(true);
    } else if (!hasAccess) {
      navigate("/");
    }
  }, [user, hasAccess, navigate, location]);

  // If no user, show the popup
  if (!user) {
    return (
      <Popup trigger={open}>
        <div className="protected__popup">
          <div className="message">
            <CgUnavailable /> <h3>Oops, You're not authorized to access this page!</h3>
          </div>


          <div className="actions">
            <Link to="/">
              <button className="popup__button">LOGIN HERE</button>
            </Link>
          </div>
        </div>
      </Popup>
    );
  }

  // If user exists and has access, render the children
  if (hasAccess) {
    return children;
  }

  // If user exists but lacks access, return null (redirect handled in useEffect)
  return null;
};

export default ProtectedRoute;
