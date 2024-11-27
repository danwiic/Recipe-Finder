import { useEffect, useState } from "react"
import Sidebar from "../../Components/Sidebar"
import './Style/Overview.css'
import axios from "axios"
import Line from "../../Components/Graph/Line"
import Bar from "../../Components/Graph/Bar"
Line

export default function Data() {

    const [total, setTotal] = useState(0)
    const [pendingRecipe, setTotalPendingRecipe] = useState(0)
    const [totalMeals, setTotalMeals] = useState(0)

    useEffect(() => {
        fetchTotalUser()
        fetchTotalPendingRecipe()
        fetchTotalMeals()
    }, [])

    const fetchTotalUser = async () => {
        try{
            const res = await axios.get('http://192.168.1.185:8800/users')
            const data = res.data
            setTotal(data)
            console.log(data);
            
        }catch(err){
            console.log(err);
        }
    }
    console.log(pendingRecipe);
    

    const fetchTotalPendingRecipe = async () => {
        try{
            const res = await axios.get('http://192.168.1.185:8800/pending/recipes/total')
            const data = res.data
            setTotalPendingRecipe(data)
            console.log("pending: ", data);
            
        }catch(err){
            console.log(err);
        }
    }

    const fetchTotalMeals = async () => {
        try{
            const res = await axios.get('http://192.168.1.185:8800/total/meals')
            const data = res.data
            setTotalMeals(data)
            console.log("pending: ", data);
            
        }catch(err){
            console.log(err);
        }
    }

    return(
        <div>
            <Sidebar>
                <div className="overview__con">
                    <div className="cards__container">
                        <div className="card">
                            <div className="card__data"> {total.userCount}</div>
                            <div className="card__title">
                                TOTAL USERS
                            </div>
                        </div>

                        <div className="card">
                            <div className="card__data"> {totalMeals && totalMeals.total ? totalMeals.total : 0}</div>
                            <div className="card__title">
                                TOTAL RECIPE
                            </div>
                        </div>

                        <div className="card">
                            <div className="card__data"> 
                                {pendingRecipe && pendingRecipe.total ? pendingRecipe.total : 0}
                            </div>
                            <div className="card__title">
                                PENDING RECIPE
                            </div>
                        </div>

                        <div className="card">
                            <div className="card__data"> 0</div>
                            <div className="card__title">
                                TOTAL USERS
                            </div>
                        </div>

                        <div className="line__chart">
                            <Line />
                        </div>

                        <div className="bar__chart">
                             <Bar />
                        </div>
                    </div>
                  


                </div>
            </Sidebar>
        </div>
    )
};