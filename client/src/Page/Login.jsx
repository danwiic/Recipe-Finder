import { Link, useNavigate } from "react-router-dom";
import Layout from "../Components/Layout";
import "./Style/Login.css";
import userLogo from '/user.png';
import passLogo from '/password.png';
import bg from '/bg1.jpg';
import { useState } from "react";
import axios from 'axios'


export default function Login() {
  const navigate = useNavigate()

  const [error, setError] = useState("");
  const [user, setUser] = useState({
    username: "",
    password: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
   try{
    const res = await axios.post("http://192.168.1.185:8800/login", user)

    if (res.data.Status === 'Success') {
      navigate('/')
    } else {
      setError(res.data.Error || 'Login failed');
    }
    
   }catch(error){
    setError("Login request failed. Please try again.");
    console.error("Login error:", error);
   }

    
  };

  return (
    <Layout>
      <div className="login__container" style={{ backgroundImage: `url(${bg})` }}>
        <div className="login__layout">
          <div className="login__form__container">
            <h2 className="form__header">LOGIN</h2>
            <form className="login__form" onSubmit={handleSubmit}>
              <label className="form__labels">Username / Email</label>
              <input 
                className="input__field"
                style={{ backgroundImage: `url(${userLogo})` }}
                type="text" 
                placeholder="Username or email" 
                name="username" 
                value={user.username}
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
                value={user.password}
                onChange={handleInputChange}
                required
              />

              <div className="action">
                <Link to="/forgot-password">Forgot Password?</Link>
                <button type="submit">Login</button>
                <p>Don't have an account? <Link to="/signup">Signup</Link></p>
              </div>
              
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
