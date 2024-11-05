import Navbar from "./Navbar";

export default function Layout({children}) {
    return(
        <div className="layout__container">
            <Navbar/>

            <div>{children}</div>
        </div>
    )
};
