import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useUser } from "../Context/UserContext";
import "./Style/Login.css";
import userLogo from '/user.png';
import passLogo from '/password.png';
import bg from '/bg1.jpg';

export default function Login() {
  const navigate = useNavigate();
  const { user, setUser, setAccessToken } = useUser();

  const [login, setLogin] = useState({
    username: "",
    password: ""
  });
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLogin((prevLogin) => ({
      ...prevLogin,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear any previous errors before submitting
    setError("");

    try {
      const res = await axios.post("http://192.168.1.185:8800/login", login);

      if (res.data.Status === "Success") {
        const userData = res.data.user;
        const token = res.data.token;
        
        console.log(userData);
        

        setUser(userData);
        setAccessToken(token);

        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("accessToken", token); 

        navigate("/home"); // Redirect to the home page
      } else {
        setError(res.status.Error || "Login failed, please check your credentials.");
      }
    } catch (error) {
      setError("Invalid username or password");
    }
  };

  useEffect(() => {
    user && navigate('/home')
  })

  return (
    <div className="login__container" style={{ backgroundImage: `url(${bg})` }}>
      <div className="login__layout">
        <div className="login__form__container">
          <h2 className="form__header">LOGIN</h2>
          <form className="login__form" onSubmit={handleSubmit}>
            <label className="form__labels">Username</label>
            <input 
              className="input__field"
              style={{ backgroundImage: `url(${userLogo})` }}
              type="text" 
              placeholder="Username" 
              name="username" 
              value={login.username}
              onChange={handleInputChange}
              required
            />

            <label className="form__labels">Password</label>
            <input 
              className="input__field"
              style={{ backgroundImage: `url(${passLogo})` }} 
              type="password" 
              placeholder="Password" 
              name="password" 
              value={login.password}
              onChange={handleInputChange}
              required
            />

            <div className="action">
              <Link to="/forgot-password">Forgot Password?</Link>
              {error && (
                <p className="error-message" 
                style={{
                  color: "red",
                  fontWeight: "500",
                  margin: "10px 0 0 0"
                }}
                >
                  {error}
                </p>
              )}
              <button type="submit">Login</button>
              <p>Don't have an account? <Link to="/signup">Signup</Link></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
