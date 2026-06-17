import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaDownload, FaDatabase } from 'react-icons/fa';

const HistoryPage = () => {
    const [userEmail, setUserEmail] = useState('');
    const [readings, setReadings]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [dateFilter, setDateFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            const parsed = JSON.parse(stored);
            setUserEmail(parsed.email);
            fetchReadings(parsed.email);
        }
    }, []);

    const fetchReadings = async (email) => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/sensor-data/${email}`);
            if (res.data.status === 'success') setReadings(res.data.data);
        } catch (error) {
            console.error('Error fetching sensor history:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredReadings = readings.filter(reading => {
        if (dateFilter === 'Today') {
            const todayStr = new Date().toISOString().split('T')[0];
            return new Date(reading.createdAt).toISOString().split('T')[0] === todayStr;
        }
        if (dateFilter === '7days') {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 7);
            return new Date(reading.createdAt) >= cutoff;
        }
        return true;
    });

    const indexOfLastItem  = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentReadings  = filteredReadings.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages       = Math.ceil(filteredReadings.length / itemsPerPage);

    const downloadCSV = () => {
        if (filteredReadings.length === 0) return alert('No data to export.');

        const headers = 'Date/Time,Temperature (C),Humidity (%),Soil 1 (%),Soil 2 (%),Pump\n';

        const rows = filteredReadings.map(r => {
            // ✅ Wrap date in quotes — toLocaleString() produces "6/1/2026, 10:30 AM"
            // that comma would split into two CSV columns without the quotes
            const dateTime = `"${new Date(r.createdAt).toLocaleString()}"`;
            return `${dateTime},${r.temperature},${r.humidity},${r.soil1},${r.soil2},${r.pump ? 'ON' : 'OFF'}`;
        }).join('\n');

        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `sensor_history_${userEmail}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="container-fluid p-4 bg-white" style={{ minHeight: '100vh' }}>

            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h3 className="fw-bold text-secondary mb-1">Historical Sensor Data</h3>
                    <p className="text-muted small mb-0">All raw readings from your IoT sensors, newest first.</p>
                </div>
                <button
                    onClick={downloadCSV}
                    className="btn btn-dark btn-sm d-flex align-items-center gap-2 fw-bold shadow-sm"
                >
                    <FaDownload /> Export CSV
                </button>
            </div>

            {/* FILTER */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4" style={{ maxWidth: '400px' }}>
                <div className="card-header text-white fw-bold py-3" style={{ backgroundColor: '#10b981' }}>
                    Filter Data
                </div>
                <div className="card-body" style={{ backgroundColor: '#f8fafc' }}>
                    <label className="small fw-bold text-muted mb-2">Date Range</label>
                    <select
                        className="form-select border-0 shadow-sm"
                        value={dateFilter}
                        onChange={e => { setDateFilter(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="All">All Time</option>
                        <option value="Today">Today</option>
                        <option value="7days">Last 7 Days</option>
                    </select>
                </div>
            </div>

            {/* TABLE */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div
                    className="card-header text-white py-3 fw-bold d-flex justify-content-between align-items-center"
                    style={{ backgroundColor: '#10b981' }}
                >
                    <span>Sensor Readings</span>
                    <span className="badge bg-white fw-bold" style={{ color: '#10b981', fontSize: '0.8rem' }}>
                        {filteredReadings.length} records
                    </span>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover text-center mb-0 align-middle">
                        <thead style={{ backgroundColor: '#0f766e' }}>
                            <tr>
                                <th className="py-3 border-0 bg-transparent text-white text-start ps-4">Date / Time</th>
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
                            ) : currentReadings.length > 0 ? (
                                currentReadings.map((r, i) => (
                                    <tr key={r._id || i}>
                                        <td className="py-3 text-secondary fw-medium text-start ps-4">
                                            {new Date(r.createdAt).toLocaleString()}
                                        </td>
                                        <td className="py-3 fw-bold" style={{ color: '#f59e0b' }}>{r.temperature}</td>
                                        <td className="py-3 fw-bold" style={{ color: '#3b82f6' }}>{r.humidity}</td>
                                        <td className="py-3 fw-bold" style={{ color: '#10b981' }}>{r.soil1}</td>
                                        <td className="py-3 fw-bold" style={{ color: '#059669' }}>{r.soil2}</td>
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
                                        <FaDatabase style={{ fontSize: '2rem', opacity: 0.2, display: 'block', margin: '0 auto 8px' }} />
                                        No readings found for this selection.
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
                    {[...Array(totalPages)].map((_, i) => (
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

export default HistoryPage;