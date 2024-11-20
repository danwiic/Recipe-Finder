import { Bar as BarChart } from 'react-chartjs-2'
import {
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    BarElement,
    Legend,
    Tooltip,
    Title
} from 'chart.js'

ChartJS.register(
    CategoryScale, 
    LinearScale, 
    BarElement,
    Legend,
    Tooltip,
    Title
)

export default function Bar() {

    const options={}
    const data = {
        labels: [
            "JANUARY",
            "FEBRUARY",
            "MARCH",
            "APRIL",
            "MAY",
            "JUNE",
        ],
        datasets: [
            {
                label: "Recipes Uploaded",
                data: [12, 24, 14, 8, 100, 49],
                backgroundColor: "orange",
                borderColor: "red"
            }
        ]
    }

    return(
        <>
            <BarChart options={options} data={data} />
        </>
    )
};
