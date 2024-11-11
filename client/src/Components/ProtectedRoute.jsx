import { Navigate, useLocation, Link } from "react-router-dom";
import { useUser } from "../Context/UserContext";
import { useState, useEffect } from "react";
import Popup2 from "./PopupS.jsx";
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
       <Popup2
        trigger={open} 
        >
        <div className="protected__popup">
          <div className="message">
          <CgUnavailable /> <h3>Oops, You're not authorized to access this page!</h3>
          </div>

          <div 
            className="to__login"
            style={{
              
            }}
          >
           <Link to="/login"><button>Login here</button></Link>
          </div>
        </div>
       </Popup2>
        
      </>
    );
  }

  // If user is logged in, render the protected content
  return children;
};

export default ProtectedRoute;
