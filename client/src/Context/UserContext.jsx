import { useState, useEffect, createContext, useContext } from "react";
import Loader from "../Components/Loader"; // Assuming you have a loader component

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true); 
  

  const storedUser = localStorage.getItem("user");
  const storedToken = localStorage.getItem("accessToken");

  useEffect(() => {
    if (storedUser) {
      setUser(JSON.parse(storedUser)); // Restore user data
    }
    if (storedToken) {
      setAccessToken(storedToken); // Restore accessToken
    }
    setLoading(false); // Set loading to false after checking localStorage
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, accessToken, setAccessToken }}>
      {loading ? <Loader /> : children} {/* Show loader until loading is done */}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
