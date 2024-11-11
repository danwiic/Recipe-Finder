import { Link } from "react-router-dom"
import Layout from "../Components/Layout.jsx"
import "./Style/Signup.css"
import userLogo from '/user.png'
import passLogo from '/password.png'
import emailLogo from '/email.png'
import bg from '/bg1.jpg'

export default function Signup() {
  return(
    <>
      <Layout>
        <div className="signup__container" style={{backgroundImage: `url(${bg})`}}>

          <div className="signup__layout">
            

              <div className="signup__form__container">
                  <h2 className="form__header">SIGNUP</h2>

                <form className="signup__form" onSubmit={(e) => {e.preventDefault}}>
                  <label className="form__labels">Username</label>
                  <input 
                    type="text" 
                    placeholder="Username" 
                    name="username" 
                    style={{backgroundImage: `url(${userLogo})`}}
                    />

                  <label className="form__labels">Email</label>
                  <input 
                    type="email" 
                    placeholder="Email" 
                    name="username" 
                    style={{backgroundImage: `url(${emailLogo})`}}
                  />

                  <label className="form__labels">Password</label>
                  <input 
                    type="password" 
                    placeholder="Create password" 
                    style={{backgroundImage: `url(${passLogo})`}}
                    name="password" />

                  <label className="form__labels">Confirm Password</label>
                  <input 
                    type="password" 
                    placeholder="Confirm password" 
                    name="password"
                    style={{backgroundImage: `url(${passLogo})`}}
                  />

                  <div className="action">
                    <button>Create account</button>
                    <p>Already have an account? <Link to="/login">Login</Link></p>
                  </div>
                  
                </form>
                
              </div>
          
        </div>
        </div>
      </Layout>
    </>
  )
};