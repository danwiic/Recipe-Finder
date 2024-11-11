import { Link } from "react-router-dom"
import Layout from "../Components/Layout"
import "./Style/Login.css"
import userLogo from '/user.png'
import passLogo from '/password.png'
import bg from '/bg1.jpg'
Link
Layout



export default function Login() {
  return(
    <>
      <Layout>
        <div className="login__container" style={{backgroundImage: `url(${bg})`}}>

          <div className="login__layout">

            

              <div className="login__form__container">
                  <h2 className="form__header">LOGIN</h2>
                    <form className="login__form" onSubmit={(e) => {e.preventDefault}}>
                        <label className="form__labels">Username / Email</label>
                        <input 
                          style={{backgroundImage: `url(${userLogo})`}}
                          type="text" 
                          placeholder="Username or email" 
                          name="username" />

                        <label className="form__labels">Password</label>
                        <input 
                          style={{backgroundImage: `url(${passLogo})`}} 
                          type="password" 
                          placeholder="Password" 
                          name="password" />

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