import { Link } from "react-router-dom"
import Layout from "../Components/Layout.jsx"
import "./Style/Signup.css"

export default function Signup() {
  return(
    <>
      <Layout>
        <div className="signup__container">

          <div className="signup__layout">
            

              <div className="signup__form__container">
                  <h2 className="form__header">SIGNUP</h2>

                <form className="signup__form" onSubmit={(e) => {e.preventDefault}}>
                  <label className="form__labels">Username</label>
                  <input type="text" placeholder="Username" name="username" />

                  <label className="form__labels">Email</label>
                  <input type="email" placeholder="Email" name="username" />

                  <label className="form__labels">Password</label>
                  <input type="password" placeholder="Create password" name="password" />

                  <label className="form__labels">Confirm Password</label>
                  <input type="password" placeholder="Confirm password" name="password" />
                  
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