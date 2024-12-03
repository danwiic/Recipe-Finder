import { useEffect, useState } from 'react';
import { Bar as BarChart } from 'react-chartjs-2';
import {
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    BarElement,
    Legend,
    Tooltip,
    Title
} from 'chart.js';

ChartJS.register(
    CategoryScale, 
    LinearScale, 
    BarElement,
    Legend,
    Tooltip,
    Title
);

export default function Bar() {
    const [data, setData] = useState(null);
    const [year, setYear] = useState(new Date().getFullYear()); // Default to current year
    const [years, setYears] = useState([]);

    // Fetch the data from the API when the component mounts or when the year changes
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`http://192.168.1.185:8800/recipes/stats?year=${year}`);
                const result = await response.json();
                const months = [
                    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 
                    'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
                ];

                const monthsData = new Array(12).fill(0); // Initialize array with 12 months

                result.forEach((item) => {
                    monthsData[item.month - 1] = item.recipes_uploaded;
                });

                setData({
                    labels: months,
                    datasets: [{
                        label: 'Recipes Uploaded',
                        data: monthsData,
                        backgroundColor: 'orange',
                        borderColor: 'red',
                    }]
                });
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [year]);

    useEffect(() => {
        const fetchYears = async () => {
            try {
                const response = await fetch('http://localhost:8800/recipes/years');
                const result = await response.json();
                setYears(result);  // Set the years in the state
                setYear(result[0]);  // Set the first year as the default (if available)
            } catch (error) {
                console.error('Error fetching years:', error);
            }
        };

        fetchYears();
    }, []);

    // Chart options
    const options = {
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: `Recipes Uploaded in ${year}`,
                font: {
                    size: 16,
                    weight: 'bold',
                }
            },
            legend: {
                position: 'top',
                labels: {
                    font: {
                        size: 14,
                    },
                },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Month',
                    font: {
                        size: 14,
                    },
                },
                grid: {
                    display: true,
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Number of Recipes Uploaded',
                    font: {
                        size: 14,
                    },
                },
                grid: {
                    display: true,
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                },
                ticks: {
                    beginAtZero: true,
                    stepSize: 10,
                },
            },
        },
    };

    return (
        <>
            {years.length > 0 && (
                <div className='bar__graph'>
                    <label htmlFor="year">Year:</label>
                    <select 
                        id="year" 
                        value={year} 
                        onChange={(e) => setYear(e.target.value)}
                    >
                        {years.map((yearOption) => (
                            <option key={yearOption} value={yearOption}>
                                {yearOption}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {data && <BarChart options={options} data={data} />}
        </>
    );
}
