import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import CurrentWeather from '../Components/CurrentWeather';
import DailyForecast from '../Components/DailyForecast';
import HourlyForecast from '../Components/HourlyForecast';

const WeatherPage = () => {
    const [currentWeather, setCurrentWeather] = useState(null);
    const [forecast, setForecast]             = useState([]);
    const [hourly, setHourly]                 = useState([]);
    const [loading, setLoading]               = useState(true);
    const [error, setError]                   = useState('');

    const API_KEY    = import.meta.env.VITE_WEATHER_API_KEY || "70f76b2fe63122285b98b324c56e4d6d";
    const CITY       = "Rawalpindi";
    const COUNTRY    = "PK";

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const [currentRes, forecastRes] = await Promise.all([
                    axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${CITY},${COUNTRY}&appid=${API_KEY}&units=metric`),
                    axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${CITY},${COUNTRY}&appid=${API_KEY}&units=metric`),
                ]);
                setCurrentWeather(currentRes.data);
                setHourly(forecastRes.data.list.slice(0, 6));
                setForecast(forecastRes.data.list.filter(r => r.dt_txt.includes("12:00:00")));
            } catch (err) {
                console.error(err);
                setError("Failed to fetch weather data. Check your API key.");
            } finally {
                setLoading(false);
            }
        };
        fetchWeather();
    }, []);

    if (loading) return (
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
            <div className="text-center">
                <div className="spinner-border text-success mb-3" style={{ width: '3rem', height: '3rem' }} />
                <div className="text-muted fw-bold">Fetching weather data...</div>
            </div>
        </div>
    );

    if (error) return (
        <div className="p-4">
            <div className="alert alert-danger rounded-4 border-0 shadow-sm">{error}</div>
        </div>
    );

    if (!currentWeather) return null;

    return (
        <div className="container-fluid p-3 p-md-4" style={{ backgroundColor: '#f0fdf4', minHeight: '100vh' }}>
            <div className="mb-4">
                <h2 className="fw-bold mb-0" style={{ color: '#064e3b' }}>Weather Station</h2>
                <p className="text-muted small mb-0">
                    Live conditions for {CITY}, Pakistan — updated just now
                </p>
            </div>

            <CurrentWeather data={currentWeather} />

            <div className="row g-4">
                <div className="col-lg-4">
                    <DailyForecast data={forecast} />
                </div>
                <div className="col-lg-8">
                    <HourlyForecast data={hourly} />
                </div>
            </div>
        </div>
    );
};

export default WeatherPage;