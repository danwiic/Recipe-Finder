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
  const [redirecting, setRedirecting] = useState(false); // Added state to track if navigation has happened

  const hasAccess = user && allowedRoles.includes(user.role);

  useEffect(() => {
    if (!user && !open) {
      setOpen(true);
    } else if (!hasAccess && !redirecting) {
      setRedirecting(true); // Set redirecting to true before calling navigate
      navigate("/", { replace: true }); // Use replace to avoid adding another entry in the history stack
    }
  }, [user, hasAccess, navigate, location, open, redirecting]); // Added redirecting and open to the dependencies

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
