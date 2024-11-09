import Navbar from "./Navbar";

export default function Layout({children}) {
    return(
        <div className="layout__container">
           <div><Navbar/></div>

            <div>{children}</div>
        </div>
    )
};
