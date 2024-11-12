import Navbar from "./Navbar";
import "./Style/Layout.css"
export default function Layout({children}) {
    return(
        <div className="layout__container">
            <div className="layout__nav">
                <Navbar/>
            </div>  
            <div>{children}</div>
        </div>
    )
};
