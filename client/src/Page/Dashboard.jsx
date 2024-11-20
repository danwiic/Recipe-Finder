import { Outlet } from "react-router";
import Layout from "../Components/Layout";
import "./Style/Dashboard.css"
import Sidebar from "../Components/Sidebar";
import Data from "./Dashboard/Data";
Data
Sidebar

export default function Dashboard() {
    return(
        <>
        <div className="dash__con">
            <Layout>
                <Outlet />
            </Layout>
        </div>
        </>
    )
};
