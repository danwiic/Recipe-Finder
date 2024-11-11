import { Navigate, useLocation, Link } from "react-router-dom";
import { useUser } from "../Context/UserContext";
import { useState, useEffect } from "react";
import Popup from "./Popup";
Popup

const ProtectedRoute = ({ children }) => {
  const { user } = useUser();
  const location = useLocation();

  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!user) {
      setOpen(true); // Show modal only if user is not logged in
    } else {
      setOpen(false); // Hide modal when user is logged in
    }
  }, [user]); // Only run when `user` changes

  // If user is not logged in, redirect to login and show modal
  if (!user) {
    return (
      <>
       <Popup
        trigger={open} 
        setTrigger={setOpen} 
        >

            Oops, you must login first to access this page!

            <div>
            <Link to="/login">Login here</Link>

            </div>
       </Popup>
        
      </>
    );
  }

  // If user is logged in, render the protected content
  return children;
};

export default ProtectedRoute;
