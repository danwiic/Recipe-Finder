import { Line as LineChart } from 'react-chartjs-2'
import {
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    PointElement,
    LineElement,
    Legend,
    Tooltip,
    Title
} from 'chart.js'

ChartJS.register(
    CategoryScale, 
    LinearScale, 
    PointElement,
    LineElement,
    Legend,
    Tooltip,
    Title
)

export default function Line() {

    const options={}
    const data = {
        labels: [
            "JANUARY",
            "FEBRUARY",
            "MARCH",
            "APRIL",
            "MAY",
            "JUNE",
            "JULY",
            "AUGUST",
            "SEPTEMBER",
            "OCTOBER",
            "NOVEMBER",
            "DECEMBER",
        ],
        datasets: [
            {
                label: "New Users",
                data: [12, 24, 14, 8, 100, 49, 20, 30, 11, 20, 60, 24],
                borderColor: "pink"
            }
        ]
    }

    return(
        <>
            <LineChart options={options} data={data} />
        </>
    )
};
