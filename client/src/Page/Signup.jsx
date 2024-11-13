import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../Components/Layout.jsx";
import axios from 'axios';
import "./Style/Signup.css";
import userLogo from '/user.png';
import passLogo from '/password.png';
import emailLogo from '/email.png';
import bg from '/bg1.jpg';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Reset error on each submit

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post('http://192.168.1.185:8800/signup', {
        username,
        email,
        password,
        confirmPassword,
      });

      // On successful signup, navigate to login page
      if (response.status === 201) {
        navigate("/login");
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Layout>
        <div className="signup__container" style={{ backgroundImage: `url(${bg})` }}>

          <div className="signup__layout">

            <div className="signup__form__container">
              <h2 className="form__header">SIGNUP</h2>

              <form className="signup__form" onSubmit={handleSubmit}>
                <label className="form__labels">Username</label>
                <input
                  type="text"
                  placeholder="Username"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ backgroundImage: `url(${userLogo})` }}
                />

                <label className="form__labels">Email</label>
                <input
                  type="email"
                  placeholder="Email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ backgroundImage: `url(${emailLogo})` }}
                />

                <label className="form__labels">Password</label>
                <input
                  type="password"
                  placeholder="Create password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ backgroundImage: `url(${passLogo})` }}
                />

                <label className="form__labels">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ backgroundImage: `url(${passLogo})` }}
                />

                {error && 
                  <p 
                    className="error-message"
                    style={{color: "red"}}
                    >{error}
                  </p>
                }

                <div className="action">
                  <button type="submit" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Create account'}
                  </button>
                  <p>Already have an account? <Link to="/login">Login</Link></p>
                </div>

              </form>
            </div>

          </div>
        </div>
      </Layout>
    </>
  );
};
