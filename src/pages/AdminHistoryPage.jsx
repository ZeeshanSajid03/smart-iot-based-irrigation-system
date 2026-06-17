import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaUserTie, FaSearch, FaDatabase } from 'react-icons/fa';

const ITEMS_PER_PAGE = 15;

const AdminHistoryPage = () => {
    const [users, setUsers] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState("");
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/users`);
                if (res.data.status === "success") {
                    const farmers = (res.data.data || []).filter(u => u.role === 'user');
                    setUsers(farmers);
                }
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
        fetchUsers();
    }, []);

    const handleFetchHistory = async (email) => {
        setSelectedEmail(email);
        setCurrentPage(1);
        setHistoryData([]);
        if (!email) return;

        setLoading(true);
        try {
            // ✅ Fixed route — was /api/sensor-readings, now /api/sensor-data
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/sensor-data/${email}`);
            if (res.data.status === "success") {
                setHistoryData(res.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching farmer history:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- PAGINATION ---
    const totalPages = Math.ceil(historyData.length / ITEMS_PER_PAGE);
    const indexOfLast = currentPage * ITEMS_PER_PAGE;
    const indexOfFirst = indexOfLast - ITEMS_PER_PAGE;
    const currentRows = historyData.slice(indexOfFirst, indexOfLast);

    return (
        <div>
            <h3 className="text-secondary fw-bold mb-1">System Data Logs</h3>
            <p className="text-muted small mb-4">View raw IoT sensor history for any registered farmer.</p>

            {/* CLIENT SELECTOR */}
            <div
                className="card border-0 shadow-sm rounded-4 mb-4"
                style={{ backgroundColor: '#f8fafc' }}
            >
                <div className="card-body p-4">
                    <label className="fw-bold text-secondary mb-2 d-flex align-items-center gap-2">
                        <FaUserTie /> Select Client Account
                    </label>
                    <div className="input-group shadow-sm">
                        <span className="input-group-text bg-white border-end-0 text-muted">
                            <FaSearch />
                        </span>
                        <select
                            className="form-select border-start-0 py-2 bg-white"
                            value={selectedEmail}
                            onChange={(e) => handleFetchHistory(e.target.value)}
                        >
                            <option value="">-- Choose a Farmer to view their data --</option>
                            {users.map(user => (
                                <option key={user._id} value={user.email}>
                                    {user.firstName} {user.lastName} ({user.email})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* RECORD COUNT LINE */}
            <p className="text-muted small fw-bold mb-2 ps-1">
                {selectedEmail
                    ? `${historyData.length} records found for: ${selectedEmail}`
                    : 'Awaiting client selection...'}
            </p>

            {/* TABLE */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0 align-middle text-center">
                            <thead>
                                <tr>
                                    <th
                                        className="py-3 ps-4 text-white border-0 text-start"
                                        style={{ backgroundColor: '#1a4d3e' }}
                                    >
                                        Timestamp
                                    </th>
                                    <th
                                        className="py-3 text-white border-0"
                                        style={{ backgroundColor: '#1a4d3e' }}
                                    >
                                        Temp (°C)
                                    </th>
                                    <th
                                        className="py-3 text-white border-0"
                                        style={{ backgroundColor: '#1a4d3e' }}
                                    >
                                        Humidity (%)
                                    </th>
                                    <th
                                        className="py-3 text-white border-0"
                                        style={{ backgroundColor: '#1a4d3e' }}
                                    >
                                        Soil 1
                                    </th>
                                    <th
                                        className="py-3 text-white border-0"
                                        style={{ backgroundColor: '#1a4d3e' }}
                                    >
                                        Soil 2
                                    </th>
                                    <th
                                        className="py-3 pe-4 text-white border-0 text-end"
                                        style={{ backgroundColor: '#1a4d3e' }}
                                    >
                                        Pump
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="py-5 text-muted">
                                            <div className="spinner-border spinner-border-sm text-success me-2" />
                                            Loading data...
                                        </td>
                                    </tr>
                                ) : !selectedEmail ? (
                                    <tr>
                                        <td colSpan="6" className="py-5 text-muted">
                                            Please select a client from the dropdown above.
                                        </td>
                                    </tr>
                                ) : currentRows.length > 0 ? (
                                    currentRows.map((log) => (
                                        <tr key={log._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td className="py-3 ps-4 text-secondary text-start">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td className="py-3 text-warning fw-bold">
                                                {log.temperature}°C
                                            </td>
                                            <td className="py-3 text-info fw-bold">
                                                {log.humidity}%
                                            </td>
                                            <td className="py-3 text-success fw-bold">
                                                {log.soil1}
                                            </td>
                                            <td className="py-3 text-success fw-bold">
                                                {log.soil2}
                                            </td>
                                            <td className="py-3 pe-4 text-end">
                                                <span
                                                    className={`badge px-3 py-2 ${log.pump ? 'bg-primary' : 'bg-secondary'}`}
                                                >
                                                    {log.pump ? 'ON' : 'OFF'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="py-5 text-muted">
                                            <FaDatabase
                                                style={{
                                                    fontSize: '2rem',
                                                    opacity: 0.2,
                                                    display: 'block',
                                                    margin: '0 auto 8px'
                                                }}
                                            />
                                            No hardware data found for this user.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* REAL PAGINATION */}
            {totalPages > 1 && (
                <div className="d-flex justify-content-center gap-2 mt-4">
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
                            style={currentPage === i + 1
                                ? { backgroundColor: '#10b981', borderColor: '#10b981' }
                                : {}
                            }
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

export default AdminHistoryPage;