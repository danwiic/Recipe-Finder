import Navbar from "./Navbar";

export default function Layout({children}) {
    return(
        <div className="layout__container">
           <div className="nav"><Navbar/></div>

            <div>{children}</div>
        </div>
    )
};
