import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
    FaThermometerHalf, FaTint, FaWifi,
    FaCheckCircle, FaTimesCircle, FaSyncAlt
} from 'react-icons/fa';

// Fixed hardware for this system
const SENSOR_DEFINITIONS = [
    {
        id: 'YL-69-01',
        type: 'Soil Moisture Sensor',
        model: 'YL-69',
        icon: FaTint,
        iconColor: '#059669',
        bgColor: '#d1fae5',
        borderColor: '#6ee7b7',
        getReading: (r) => r ? `${r.soil1}%` : null,
        getReading2: (r) => r ? `${r.soil2}%` : null,
        label1: 'Soil 1',
        label2: 'Soil 2',
    },
    {
        id: 'DHT11-01',
        type: 'Temp & Humidity Sensor',
        model: 'DHT11',
        icon: FaThermometerHalf,
        iconColor: '#d97706',
        bgColor: '#fef3c7',
        borderColor: '#fcd34d',
        getReading: (r) => r ? `${r.temperature}°C` : null,
        getReading2: (r) => r ? `${r.humidity}%` : null,
        label1: 'Temperature',
        label2: 'Humidity',
    },
];

const SensorsPage = () => {
    const [latestReading, setLatestReading] = useState(null);
    const [allReadings, setAllReadings]     = useState([]);
    const [loading, setLoading]             = useState(true);
    const [lastUpdated, setLastUpdated]     = useState(null);
    const [currentPage, setCurrentPage]     = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) { setLoading(false); return; }
        const email = JSON.parse(stored).email;

        const fetchData = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/sensor-data/${email}`);
                if (res.data.status === 'success' && res.data.data.length > 0) {
                    setLatestReading(res.data.data[0]);
                    setAllReadings(res.data.data);
                    setLastUpdated(new Date());
                }
            } catch (err) {
                console.error('Error fetching sensor data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const isOnline = latestReading
        ? (new Date() - new Date(latestReading.createdAt)) < 60000 // online if reading < 60s old
        : false;

    // Pagination for readings table
    const totalPages     = Math.ceil(allReadings.length / itemsPerPage);
    const indexOfLast    = currentPage * itemsPerPage;
    const indexOfFirst   = indexOfLast - itemsPerPage;
    const currentRows    = allReadings.slice(indexOfFirst, indexOfLast);

    return (
        <div className="container-fluid p-4 bg-white" style={{ minHeight: '100vh' }}>

            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 className="text-secondary fw-bold mb-1">Sensors</h2>
                    <p className="text-muted small mb-0">
                        Live readings from your deployed IoT hardware.
                    </p>
                </div>
                {lastUpdated && (
                    <div className="d-flex align-items-center gap-2 text-muted small">
                        <FaSyncAlt style={{ fontSize: '0.75rem' }} />
                        Updated {lastUpdated.toLocaleTimeString()}
                    </div>
                )}
            </div>

            {/* ── SYSTEM STATUS BANNER ────────────────────────────────────── */}
            <div
                className="d-flex align-items-center gap-3 p-3 rounded-4 mb-4 shadow-sm"
                style={{
                    backgroundColor: isOnline ? '#dcfce7' : '#fef2f2',
                    border: `1px solid ${isOnline ? '#86efac' : '#fecaca'}`,
                }}
            >
                {isOnline
                    ? <FaCheckCircle style={{ color: '#16a34a', fontSize: '1.2rem', flexShrink: 0 }} />
                    : <FaTimesCircle style={{ color: '#dc2626', fontSize: '1.2rem', flexShrink: 0 }} />
                }
                <div>
                    <div className="fw-bold" style={{ color: isOnline ? '#166534' : '#991b1b', fontSize: '0.9rem' }}>
                        {isOnline ? 'All sensors online' : 'Sensors offline or no data received'}
                    </div>
                    <div className="small" style={{ color: isOnline ? '#15803d' : '#b91c1c' }}>
                        {loading
                            ? 'Connecting...'
                            : latestReading
                                ? `Last reading: ${new Date(latestReading.createdAt).toLocaleString()}`
                                : 'No readings yet — check hardware connection or seed test data'}
                    </div>
                </div>
                <div className="ms-auto d-flex align-items-center gap-2">
                    <span style={{
                        display: 'inline-block', width: '9px', height: '9px',
                        borderRadius: '50%', backgroundColor: isOnline ? '#16a34a' : '#dc2626',
                        animation: isOnline ? 'pulse 1.5s infinite' : 'none',
                    }} />
                    <span className="small fw-bold" style={{ color: isOnline ? '#166534' : '#991b1b' }}>
                        {isOnline ? 'LIVE' : 'OFFLINE'}
                    </span>
                </div>
            </div>

            {/* ── SENSOR CARDS ────────────────────────────────────────────── */}
            <h5 className="fw-bold text-secondary mb-3">Deployed Hardware</h5>
            <div className="row g-4 mb-5">
                {SENSOR_DEFINITIONS.map((sensor) => {
                    const Icon     = sensor.icon;
                    const reading1 = sensor.getReading(latestReading);
                    const reading2 = sensor.getReading2(latestReading);

                    return (
                        <div className="col-md-6" key={sensor.id}>
                            <div
                                className="card border-0 shadow-sm rounded-4 h-100"
                                style={{ borderTop: `4px solid ${sensor.borderColor}` }}
                            >
                                <div className="card-body p-4">
                                    {/* Card header row */}
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <div
                                                className="rounded-3 d-flex align-items-center justify-content-center"
                                                style={{
                                                    width: '48px', height: '48px',
                                                    backgroundColor: sensor.bgColor,
                                                    border: `1px solid ${sensor.borderColor}`,
                                                }}
                                            >
                                                <Icon style={{ color: sensor.iconColor, fontSize: '1.3rem' }} />
                                            </div>
                                            <div>
                                                <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>
                                                    {sensor.type}
                                                </div>
                                                <div className="small text-muted">Model: {sensor.model}</div>
                                            </div>
                                        </div>
                                        <span
                                            className="badge px-3 py-2 fw-bold"
                                            style={{
                                                backgroundColor: isOnline ? '#dcfce7' : '#fee2e2',
                                                color: isOnline ? '#166534' : '#991b1b',
                                                fontSize: '0.7rem',
                                                border: `1px solid ${isOnline ? '#86efac' : '#fca5a5'}`,
                                            }}
                                        >
                                            <FaWifi className="me-1" />
                                            {isOnline ? 'ACTIVE' : 'OFFLINE'}
                                        </span>
                                    </div>

                                    {/* Reading values */}
                                    <div className="row g-2">
                                        <div className="col-6">
                                            <div
                                                className="p-3 rounded-3 text-center"
                                                style={{ backgroundColor: sensor.bgColor }}
                                            >
                                                <div className="small text-muted mb-1">{sensor.label1}</div>
                                                <div className="fw-bold fs-4" style={{ color: sensor.iconColor }}>
                                                    {loading ? '--' : reading1 ?? 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div
                                                className="p-3 rounded-3 text-center"
                                                style={{ backgroundColor: sensor.bgColor }}
                                            >
                                                <div className="small text-muted mb-1">{sensor.label2}</div>
                                                <div className="fw-bold fs-4" style={{ color: sensor.iconColor }}>
                                                    {loading ? '--' : reading2 ?? 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sensor ID footer */}
                                    <div
                                        className="mt-3 pt-2 border-top d-flex justify-content-between small text-muted"
                                    >
                                        <span>ID: <strong>{sensor.id}</strong></span>
                                        <span>
                                            {latestReading
                                                ? new Date(latestReading.createdAt).toLocaleTimeString()
                                                : '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── READINGS HISTORY TABLE ──────────────────────────────────── */}
            <h5 className="fw-bold text-secondary mb-3">Recent Readings</h5>
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div
                    className="card-header text-white py-3 fw-bold d-flex justify-content-between align-items-center"
                    style={{ backgroundColor: '#0f5132' }}
                >
                    <span>Raw Data Log</span>
                    <span
                        className="badge bg-white fw-bold"
                        style={{ color: '#0f5132', fontSize: '0.78rem' }}
                    >
                        {allReadings.length} records
                    </span>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover text-center mb-0 align-middle">
                        <thead style={{ backgroundColor: '#1a4d3e' }}>
                            <tr>
                                <th className="py-3 border-0 bg-transparent text-white text-start ps-4">Timestamp</th>
                                <th className="py-3 border-0 bg-transparent text-white">Temp (°C)</th>
                                <th className="py-3 border-0 bg-transparent text-white">Humidity (%)</th>
                                <th className="py-3 border-0 bg-transparent text-white">Soil 1 (%)</th>
                                <th className="py-3 border-0 bg-transparent text-white">Soil 2 (%)</th>
                                <th className="py-3 border-0 bg-transparent text-white">Pump</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-5 text-muted">
                                        <div className="spinner-border spinner-border-sm text-success me-2" />
                                        Loading sensor data...
                                    </td>
                                </tr>
                            ) : currentRows.length > 0 ? (
                                currentRows.map((r, i) => (
                                    <tr key={r._id || i}>
                                        <td className="py-3 text-secondary text-start ps-4" style={{ fontSize: '0.83rem' }}>
                                            {new Date(r.createdAt).toLocaleString()}
                                        </td>
                                        <td className="py-3 fw-bold" style={{ color: '#d97706' }}>{r.temperature}°C</td>
                                        <td className="py-3 fw-bold" style={{ color: '#3b82f6' }}>{r.humidity}%</td>
                                        <td className="py-3 fw-bold" style={{ color: '#059669' }}>{r.soil1}%</td>
                                        <td className="py-3 fw-bold" style={{ color: '#047857' }}>{r.soil2}%</td>
                                        <td className="py-3">
                                            <span className={`badge px-3 py-2 fw-bold ${r.pump ? 'bg-primary' : 'bg-secondary'}`}>
                                                {r.pump ? 'ON' : 'OFF'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-5 text-muted">
                                        No sensor readings yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4 gap-2">
                    <button
                        className="btn btn-dark btn-sm px-3"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                    >
                        Previous
                    </button>
                    {[...Array(Math.min(totalPages, 7))].map((_, i) => (
                        <button
                            key={i}
                            className={`btn btn-sm px-3 fw-bold ${currentPage === i + 1 ? 'text-white' : 'btn-outline-secondary'}`}
                            style={currentPage === i + 1 ? { backgroundColor: '#10b981', borderColor: '#10b981' } : {}}
                            onClick={() => setCurrentPage(i + 1)}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button
                        className="btn btn-dark btn-sm px-3"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default SensorsPage;