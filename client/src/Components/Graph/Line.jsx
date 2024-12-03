import { Line as LineChart } from 'react-chartjs-2';
import { useEffect, useState } from 'react';
import {
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    PointElement,
    LineElement,
    Legend,
    Tooltip,
    Title
} from 'chart.js';
import "./Graph.css"

ChartJS.register(
    CategoryScale, 
    LinearScale, 
    PointElement,
    LineElement,
    Legend,
    Tooltip,
    Title
);

export default function Line() {
    const [userCounts, setUserCounts] = useState([]);
    const [availableYears, setAvailableYears] = useState([]); // Store available years
    const [year, setYear] = useState(new Date().getFullYear());  // Default to current year
    const [quarter, setQuarter] = useState(null);  // No quarter selected by default

    // Function to get data for a specific quarter
    const getQuarterData = (data, quarter) => {
        const quarterStartMonth = (quarter - 1) * 3; // Calculate the start month for the quarter
        // Ensure that the data slice doesn't exceed available data length
        return data.slice(quarterStartMonth, quarterStartMonth + 3).concat(new Array(3 - data.length % 3).fill(0)); // Fill missing months with 0
    };

    // Function to get labels for a specific quarter
    const getQuarterLabels = (quarter) => {
        const quarterLabels = {
            1: ["JANUARY", "FEBRUARY", "MARCH"],
            2: ["APRIL", "MAY", "JUNE"],
            3: ["JULY", "AUGUST", "SEPTEMBER"],
            4: ["OCTOBER", "NOVEMBER", "DECEMBER"],
        };
        return quarterLabels[quarter] || [];
    };

    // Fetch available years from the API when the component mounts
    useEffect(() => {
        const fetchYears = async () => {
            try {
                const response = await fetch('http://192.168.1.185:8800/users/years');
                const years = await response.json();
                setAvailableYears(years);  // Set available years to populate the year select
            } catch (error) {
                console.error('Error fetching years:', error);
            }
        };

        fetchYears();  // Fetch years when the component mounts
    }, []);

    // Fetch the data from the API based on the selected year and quarter
    useEffect(() => {
        const fetchData = async () => {
            try {
                const query = new URLSearchParams();
                query.append('year', year);
                if (quarter) query.append('quarter', quarter); // Include quarter if selected
                const response = await fetch(`http://192.168.1.185:8800/users/filtered?${query.toString()}`);
                const data = await response.json();
                setUserCounts(data);  // Update the state with the fetched data
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchData();  // Fetch data when the component mounts or when year/quarter changes
    }, [year, quarter]);

    // Prepare chart data once user counts are available
    const data = {
        labels: quarter
            ? getQuarterLabels(quarter)  // Get the labels for the selected quarter
            : [
                "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY",
                "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
            ],
        datasets: [
            {
                label: "New Users",
                data: userCounts.length
                    ? (quarter 
                        ? getQuarterData(userCounts, quarter) // Get the data for the selected quarter
                        : userCounts // If no quarter selected, use all 12 months data
                      )
                    : new Array(12).fill(0),  // Default to 0 if no data yet
                borderColor: "pink",
                backgroundColor: "rgba(255, 105, 180, 0.2)",
                pointBackgroundColor: "pink",
                pointBorderColor: "#fff",
                tension: 0.4,
                fill: true,
            }
        ]
    };

    const options = {
        responsive: true,
        plugins: {
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
                    text: 'Number of New Users',
                    font: {
                        size: 14,
                    },
                },
                grid: {
                    display: true,
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                },
                ticks: {
                    beginAtZero: true, // Ensures the y-axis starts from zero
                    stepSize: 10,
                },
                min: 0,
            },
        },
    };
    

    return (
        <>
            {/* Year and Quarter Filter */}
            <div className='line__graph'>
                <label htmlFor="year">Year:</label>
                <select 
                    id="year" 
                    value={year} 
                    onChange={(e) => setYear(e.target.value)}
                >
                    {availableYears.map((yearOption) => (
                        <option key={yearOption} value={yearOption}>{yearOption}</option>
                    ))}
                </select>
                
                <label htmlFor="quarter">Quarter:</label>
                <select 
                    id="quarter" 
                    value={quarter || ''} 
                    onChange={(e) => setQuarter(e.target.value || null)}
                >
                    <option value="">All</option>
                    <option value="1">Q1</option>
                    <option value="2">Q2</option>
                    <option value="3">Q3</option>
                    <option value="4">Q4</option>
                </select>
            </div>

            <LineChart options={options} data={data} />
        </>
    );
}
