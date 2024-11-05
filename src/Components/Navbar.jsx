import { BiSolidFoodMenu } from "react-icons/bi";
import "./Style/Navbar.css"

export default function Navbar() {
    return(
        <div className="navbar__container">
            <div className="logo"><BiSolidFoodMenu />Meal Recipe</div>
        </div>
    )
};
