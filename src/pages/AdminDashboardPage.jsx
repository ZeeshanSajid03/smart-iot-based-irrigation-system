import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
    FaUsers, FaLeaf, FaServer, FaBrain, FaTint,
    FaCheckCircle, FaExclamationCircle, FaArrowUp, FaSyncAlt
} from 'react-icons/fa';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

// ── ANIMATED COUNTER ─────────────────────────────────────────────────────────
const AnimatedNumber = ({ value, duration = 800 }) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        if (!value) return;
        let start = 0;
        const step = Math.ceil(value / (duration / 16));
        const timer = setInterval(() => {
            start += step;
            if (start >= value) { setDisplay(value); clearInterval(timer); }
            else setDisplay(start);
        }, 16);
        return () => clearInterval(timer);
    }, [value, duration]);
    return <>{display}</>;
};

// ── STAT CARD ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, bgColor, loading, subtitle }) => (
    <div className="card border-0 shadow-sm rounded-4 p-4 h-100"
        style={{ borderLeft: `5px solid ${color}`, transition: 'transform 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
        <div className="d-flex justify-content-between align-items-start">
            <div>
                <p className="text-muted small text-uppercase fw-bold mb-1" style={{ letterSpacing: '0.06em' }}>
                    {label}
                </p>
                <h2 className="fw-bold text-dark mb-0" style={{ fontSize: '2rem' }}>
                    {loading ? (
                        <span className="placeholder col-4 rounded" style={{ height: '2rem' }} />
                    ) : (
                        <AnimatedNumber value={value} />
                    )}
                </h2>
                {subtitle && <p className="text-muted small mb-0 mt-1">{subtitle}</p>}
            </div>
            <div className="p-3 rounded-circle d-flex align-items-center justify-content-center"
                style={{ backgroundColor: bgColor, width: '56px', height: '56px' }}>
                <Icon size={22} style={{ color }} />
            </div>
        </div>
    </div>
);

// ── CUSTOM AREA TOOLTIP ───────────────────────────────────────────────────────
const AreaTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: '#fff', border: '1px solid #e2e8f0',
            borderRadius: '10px', padding: '10px 14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '0.82rem'
        }}>
            <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>{label}</div>
            <div style={{ color: '#10b981' }}>📡 {payload[0].value} readings</div>
        </div>
    );
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
const AdminDashboardPage = () => {
    const [stats, setStats]           = useState(null);
    const [chartData, setChartData]   = useState([]);
    const [recentUsers, setRecentUsers] = useState([]);
    const [loading, setLoading]       = useState(true);
    const [lastRefresh, setLastRefresh] = useState(null);

    const fetchAll = async () => {
        try {
            const [statsRes, chartRes, usersRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/admin/stats`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sensor-data/admin-stats`),
                axios.get(`${import.meta.env.VITE_API_URL}/admin/users`),
            ]);

            if (statsRes.data.status === 'success') {
                setStats(statsRes.data.data);
            }

            if (chartRes.data.status === 'success') {
                setChartData(chartRes.data.data);
            }

            if (usersRes.data.status === 'success') {
                const farmers = (usersRes.data.data || [])
                    .filter(u => u.role !== 'admin')
                    .slice(0, 5); // show 5 most recently registered
                setRecentUsers(farmers);
            }

            setLastRefresh(new Date());
        } catch (err) {
            console.error('Admin dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
        const interval = setInterval(fetchAll, 30000); // refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const totalReadings = chartData.reduce((sum, d) => sum + d.readings, 0);
    const maxReadings   = Math.max(...chartData.map(d => d.readings), 1);

    return (
        <div className="container-fluid p-4" style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>

            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-0" style={{ color: '#1e293b' }}>System Overview</h2>
                    <p className="text-muted small mb-0">
                        Real-time data across all registered farms and sensors.
                    </p>
                </div>
                <div className="d-flex align-items-center gap-2">
                    {lastRefresh && (
                        <span className="text-muted small d-flex align-items-center gap-1">
                            <FaSyncAlt size={11} />
                            {lastRefresh.toLocaleTimeString()}
                        </span>
                    )}
                    <button
                        className="btn btn-sm fw-bold d-flex align-items-center gap-2"
                        style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px' }}
                        onClick={fetchAll}
                    >
                        <FaSyncAlt size={12} /> Refresh
                    </button>
                </div>
            </div>

            {/* ── STAT CARDS ─────────────────────────────────────────────── */}
            <div className="row g-4 mb-4">
                <div className="col-md-3">
                    <StatCard
                        label="Total Farmers"
                        value={stats?.totalFarmers ?? 0}
                        icon={FaUsers}
                        color="#3b82f6"
                        bgColor="#eff6ff"
                        loading={loading}
                        subtitle="Verified accounts"
                    />
                </div>
                <div className="col-md-3">
                    <StatCard
                        label="Total Fields"
                        value={stats?.totalFields ?? 0}
                        icon={FaLeaf}
                        color="#10b981"
                        bgColor="#f0fdf4"
                        loading={loading}
                        subtitle="Configured by farmers"
                    />
                </div>
                <div className="col-md-3">
                    <StatCard
                        label="Smart Mode On"
                        value={stats?.smartModeOn ?? 0}
                        icon={FaBrain}
                        color="#8b5cf6"
                        bgColor="#f5f3ff"
                        loading={loading}
                        subtitle="AI-controlled farms"
                    />
                </div>
                <div className="col-md-3">
                    <StatCard
                        label="Active Pumps"
                        value={stats?.pumpsActive ?? 0}
                        icon={FaTint}
                        color="#f59e0b"
                        bgColor="#fffbeb"
                        loading={loading}
                        subtitle="Currently irrigating"
                    />
                </div>
            </div>

            {/* ── CHART + RECENT USERS ────────────────────────────────────── */}
            <div className="row g-4 mb-4">

                {/* AREA CHART — real IoT readings per day */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-header bg-white border-0 pt-4 pb-0 px-4 d-flex justify-content-between align-items-start">
                            <div>
                                <h5 className="fw-bold text-dark mb-0">IoT Data Packets — Last 7 Days</h5>
                                <p className="text-muted small mb-0">
                                    Total sensor readings received across all farms
                                </p>
                            </div>
                            <div className="px-3 py-1 rounded-pill small fw-bold"
                                style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #86efac' }}>
                                {totalReadings.toLocaleString()} total
                            </div>
                        </div>
                        <div className="card-body px-4 pb-4 pt-3">
                            {loading ? (
                                <div className="d-flex align-items-center justify-content-center" style={{ height: '280px' }}>
                                    <div className="spinner-border text-success" />
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorReadings" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                                        <YAxis axisLine={false} tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                        <Tooltip content={<AreaTooltip />} />
                                        <Area type="monotone" dataKey="readings"
                                            stroke="#10b981" strokeWidth={2.5}
                                            fillOpacity={1} fill="url(#colorReadings)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* RECENT FARMERS */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-header bg-white border-0 pt-4 pb-3 px-4">
                            <h5 className="fw-bold text-dark mb-0">Recent Farmers</h5>
                            <p className="text-muted small mb-0">Latest registered accounts</p>
                        </div>
                        <div className="card-body p-0">
                            {loading ? (
                                <div className="d-flex align-items-center justify-content-center py-5">
                                    <div className="spinner-border spinner-border-sm text-success" />
                                </div>
                            ) : recentUsers.length === 0 ? (
                                <div className="text-center text-muted small py-5">No farmers registered yet.</div>
                            ) : (
                                <ul className="list-group list-group-flush">
                                    {recentUsers.map(user => (
                                        <li key={user._id} className="list-group-item px-4 py-3 d-flex align-items-center gap-3 border-bottom border-light">
                                            <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                                                style={{ width: '38px', height: '38px', backgroundColor: '#10b981', fontSize: '0.85rem', flexShrink: 0 }}>
                                                {user.firstName?.[0]}{user.lastName?.[0]}
                                            </div>
                                            <div className="flex-grow-1 overflow-hidden">
                                                <div className="fw-bold text-dark small"
                                                    style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {user.firstName} {user.lastName}
                                                </div>
                                                <div className="text-muted" style={{ fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {user.email}
                                                </div>
                                            </div>
                                            {user.isVerified ? (
                                                <FaCheckCircle style={{ color: '#10b981', flexShrink: 0 }} size={14} />
                                            ) : (
                                                <FaExclamationCircle style={{ color: '#f59e0b', flexShrink: 0 }} size={14} />
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── READINGS BAR BREAKDOWN + PUMP STATUS ────────────────────── */}
            <div className="row g-4">

                {/* BAR CHART — daily breakdown */}
                <div className="col-lg-7">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-header bg-white border-0 pt-4 pb-0 px-4">
                            <h5 className="fw-bold text-dark mb-0">Daily Reading Breakdown</h5>
                            <p className="text-muted small mb-0">Bars highlight the busiest day</p>
                        </div>
                        <div className="card-body px-4 pb-4 pt-3">
                            {loading ? (
                                <div className="d-flex align-items-center justify-content-center" style={{ height: '220px' }}>
                                    <div className="spinner-border text-success" />
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }} barCategoryGap="30%">
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                        <Tooltip content={<AreaTooltip />} cursor={{ fill: 'rgba(16,185,129,0.06)' }} />
                                        <Bar dataKey="readings" radius={[6, 6, 0, 0]} maxBarSize={48}>
                                            {chartData.map((d, i) => (
                                                <Cell
                                                    key={i}
                                                    fill={d.readings === maxReadings ? '#059669' : '#6ee7b7'}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* SYSTEM STATUS PANEL */}
                <div className="col-lg-5">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-header bg-white border-0 pt-4 pb-3 px-4">
                            <h5 className="fw-bold text-dark mb-0">System Status</h5>
                            <p className="text-muted small mb-0">Live platform health</p>
                        </div>
                        <div className="card-body px-4 pb-4">
                            {[
                                {
                                    label: 'Backend API',
                                    status: 'Operational',
                                    color: '#10b981',
                                    bg: '#f0fdf4',
                                    dot: '#10b981',
                                },
                                {
                                    label: 'MongoDB Atlas (Main)',
                                    status: 'Connected',
                                    color: '#10b981',
                                    bg: '#f0fdf4',
                                    dot: '#10b981',
                                },
                                {
                                    label: 'IoT Database (Cluster B)',
                                    status: chartData.some(d => d.readings > 0) ? 'Receiving Data' : 'Idle',
                                    color: chartData.some(d => d.readings > 0) ? '#10b981' : '#f59e0b',
                                    bg: chartData.some(d => d.readings > 0) ? '#f0fdf4' : '#fffbeb',
                                    dot: chartData.some(d => d.readings > 0) ? '#10b981' : '#f59e0b',
                                },
                                {
                                    label: 'AI Prediction Service',
                                    status: stats?.smartModeOn > 0 ? `Active (${stats.smartModeOn} farm${stats.smartModeOn > 1 ? 's' : ''})` : 'Standby',
                                    color: stats?.smartModeOn > 0 ? '#8b5cf6' : '#94a3b8',
                                    bg: stats?.smartModeOn > 0 ? '#f5f3ff' : '#f8fafc',
                                    dot: stats?.smartModeOn > 0 ? '#8b5cf6' : '#94a3b8',
                                },
                                {
                                    label: 'Active Irrigation',
                                    status: stats?.pumpsActive > 0
                                        ? `${stats.pumpsActive} pump${stats.pumpsActive > 1 ? 's' : ''} running`
                                        : 'No active pumps',
                                    color: stats?.pumpsActive > 0 ? '#f59e0b' : '#94a3b8',
                                    bg: stats?.pumpsActive > 0 ? '#fffbeb' : '#f8fafc',
                                    dot: stats?.pumpsActive > 0 ? '#f59e0b' : '#94a3b8',
                                },
                            ].map((item, i) => (
                                <div key={i}
                                    className="d-flex align-items-center justify-content-between p-3 rounded-3 mb-2"
                                    style={{ backgroundColor: item.bg }}>
                                    <div className="d-flex align-items-center gap-2">
                                        <span style={{
                                            width: '8px', height: '8px', borderRadius: '50%',
                                            backgroundColor: item.dot,
                                            display: 'inline-block',
                                            animation: item.dot !== '#94a3b8' ? 'pulse 2s infinite' : 'none',
                                        }} />
                                        <span className="small fw-bold text-dark">{item.label}</span>
                                    </div>
                                    <span className="small fw-bold" style={{ color: item.color }}>
                                        {loading ? '...' : item.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;