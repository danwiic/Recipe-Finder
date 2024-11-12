import { useState } from "react";
import Layout from "../Components/Layout";
import "./Style/Favorites.css"
import axios from 'axios'
useState

export default function Recipe() {
    const [favorite, setFavorite] = useState({})
    

    return(
        <>
        <Layout>
            <div className="fav__layout">
                <h3>FAVORITE MEALS</h3>

                
            </div>
        </Layout>
        </>
    )
};
