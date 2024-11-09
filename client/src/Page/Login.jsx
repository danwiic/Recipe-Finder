import { Link } from "react-router-dom"
import Layout from "../Components/Layout"
import "./Style/Login.css"
Link
Layout



export default function Login() {
  return(
    <>
      <Layout>
        <div className="login__container">

          <div className="login__layout">

            

              <div className="login__form__container">
                  <h2 className="form__header">LOGIN</h2>
                    <form className="login__form" onSubmit={(e) => {e.preventDefault}}>
                        <label className="form__labels">Username</label>
                        <input type="text" placeholder="Username or email" name="username" />

                        <label className="form__labels">Password</label>
                        <input type="password" placeholder="Password" name="password" />

                        <div className="action">
                          <Link>Forgot Password?</Link>
                          <button>Login</button>
                          <p>Dont have an account? <Link to="/signup">Signup</Link></p>
                        </div>
                        
                    </form>
              </div>
          
        </div>
        </div>
      </Layout>
    </>
  )
};