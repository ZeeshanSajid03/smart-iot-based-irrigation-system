import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import NotificationBell from '../Components/NotificationBell';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
    FaThLarge, FaHistory, FaBell, FaUsers,
    FaUser, FaSignOutAlt, FaCloudSun, FaBars, FaTimes
} from 'react-icons/fa';

const logoImg = "/Logo.png";

const AdminLayout = () => {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [headerWeather, setHeaderWeather] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [headerUser, setHeaderUser] = useState({
        name: "Admin", photoUrl: null, email: ""
    });

    useEffect(() => {
        const timer = setInterval(() => setCurrentDate(new Date()), 1000);

        const fetchHeaderWeather = async () => {
            try {
                const API_KEY = import.meta.env.VITE_WEATHER_API_KEY || "70f76b2fe63122285b98b324c56e4d6d";
                const response = await axios.get(
                    `https://api.openweathermap.org/data/2.5/weather?q=Rawalpindi&appid=${API_KEY}&units=metric`
                );
                setHeaderWeather(response.data);
            } catch (err) { console.error("Failed to fetch header weather", err); }
        };

        const loadUser = () => {
            const stored = localStorage.getItem("user");
            if (stored) {
                const p = JSON.parse(stored);
                setHeaderUser({ name: `${p.firstName} ${p.lastName}`, photoUrl: p.photoUrl || null, email: p.email });
            }
        };

        fetchHeaderWeather();
        loadUser();
        window.addEventListener("storage", loadUser);
        return () => {
            clearInterval(timer);
            window.removeEventListener("storage", loadUser);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate('/login');
    };

    const handleNavClick = () => setSidebarOpen(false);

    const NAV_LINKS = [
        { to: "/admin/dashboard", icon: FaThLarge, label: "Dashboard" },
        { to: "/admin/history", icon: FaHistory, label: "History" },
        { to: "/admin/notifications", icon: FaBell, label: "Notifications" },
        { to: "/admin/users", icon: FaUsers, label: "Users Management" },
        { to: "/admin/profile", icon: FaUser, label: "Profile" },
    ];

    const SidebarContent = () => (
        <>
            <div className="d-flex align-items-center justify-content-between mb-5 mt-2">
                <div className="d-flex align-items-center">
                    <div className="bg-white rounded-circle p-1 me-2 d-flex align-items-center justify-content-center shadow-sm"
                        style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                        <img src={logoImg} alt="Logo" style={{ width: '26px', height: 'auto' }} />
                    </div>
                    <div>
                        <div className="fw-bold text-white" style={{ fontSize: '0.92rem', lineHeight: 1.2 }}>Smart Irrigation</div>
                        <div className="text-white-50 extra-small">Admin Panel</div>
                    </div>
                </div>
                <button
                    className="d-md-none btn p-1 ms-2"
                    style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', color: '#fff', lineHeight: 1 }}
                    onClick={() => setSidebarOpen(false)}
                >
                    <FaTimes size={16} />
                </button>
            </div>

            <ul className="nav nav-pills flex-column mb-auto gap-1">
                {NAV_LINKS.map(({ to, icon: Icon, label }) => (
                    <li key={to} className="nav-item">
                        <NavLink
                            to={to}
                            onClick={handleNavClick}
                            className={({ isActive }) =>
                                `nav-link d-flex align-items-center gap-3 ${isActive ? 'active-link' : ''}`
                            }
                        >
                            <Icon size={15} /> {label}
                        </NavLink>
                    </li>
                ))}
            </ul>

            <div className="mt-auto pt-3 text-center extra-small text-white-50">
                © 2025 Smart Irrigation
            </div>
        </>
    );

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

            {/* MOBILE BACKDROP */}
            <div
                className={`sidebar-backdrop ${sidebarOpen ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* SIDEBAR */}
            <div className={`sidebar-panel d-flex flex-column p-3 ${sidebarOpen ? 'sidebar-open' : ''}`}>
                <SidebarContent />
            </div>

            {/* MAIN CONTENT */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

                {/* HEADER — always exactly 64px */}
                <header className="dashboard-header px-3 px-md-4">

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                        <button
                            className="sidebar-hamburger"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Open menu"
                        >
                            <FaBars size={17} />
                        </button>

                        <span className="header-time-text d-none d-sm-block">
                            {currentDate.toLocaleDateString('en-US', {
                                weekday: 'long', year: 'numeric',
                                month: 'long', day: 'numeric'
                            })}
                            <span style={{ margin: '0 8px', opacity: 0.5 }}>•</span>
                            {currentDate.toLocaleTimeString()}
                        </span>

                        <span className="header-time-text d-sm-none">
                            {currentDate.toLocaleTimeString()}
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>

                        <div className="header-weather-widget d-none d-md-flex">
                            <FaCloudSun style={{ marginRight: '6px', flexShrink: 0 }} />
                            {headerWeather ? (
                                <span>
                                    {Math.round(headerWeather.main.temp)}°C
                                    <span style={{ color: 'rgba(255,255,255,0.6)', marginLeft: '5px', textTransform: 'capitalize' }}>
                                        {headerWeather.weather[0].description}
                                    </span>
                                </span>
                            ) : <span style={{ opacity: 0.6 }}>Loading...</span>}
                        </div>

                        <NotificationBell userEmail={headerUser.email} />

                        <div
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                            onClick={() => navigate("/admin/profile")}
                            title="View Profile"
                        >
                            <div className="header-user-name d-none d-lg-block" style={{ lineHeight: 1.2, textAlign: 'right' }}>
                                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                    {headerUser.name}
                                </div>
                                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.7rem' }}>
                                    Admin
                                </div>
                            </div>

                            <div className="header-profile-img rounded-circle border border-2 border-white d-flex align-items-center justify-content-center overflow-hidden bg-white text-secondary">
                                {headerUser.photoUrl
                                    ? <img src={headerUser.photoUrl} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <FaUser size={16} />}
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="btn btn-danger btn-sm d-flex align-items-center gap-2"
                            style={{ fontSize: '0.78rem', padding: '6px 12px', flexShrink: 0 }}
                        >
                            <span className="d-none d-sm-inline">Logout</span>
                            <FaSignOutAlt size={13} />
                        </button>
                    </div>
                </header>

                <main style={{ flex: 1, overflowY: 'auto', backgroundColor: '#fff', padding: '24px' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;