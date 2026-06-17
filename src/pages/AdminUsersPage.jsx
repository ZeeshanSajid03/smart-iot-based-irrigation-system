import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
    FaLeaf, FaChevronDown, FaChevronUp,
    FaCheckCircle, FaUserAlt, FaTrash
} from 'react-icons/fa';

const ITEMS_PER_PAGE = 8;

const AdminUsersPage = () => {
    const [users, setUsers]             = useState([]);
    const [fieldCounts, setFieldCounts] = useState({});  // { email: count }
    const [fieldDetails, setFieldDetails] = useState({}); // { email: [fields] }
    const [expandedUser, setExpandedUser] = useState(null); // email string
    const [loading, setLoading]         = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchUsersAndCounts();
    }, []);

    const fetchUsersAndCounts = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/users`);
            if (res.data.status !== 'success') return;

            const farmers = (res.data.data || []).filter(u => u.role !== 'admin');
            setUsers(farmers);

            if (farmers.length === 0) return;

            // Fetch field counts in one batch call
            const emails = farmers.map(u => u.email);
            const countRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/fields/counts`, { emails });
            if (countRes.data.status === 'success') {
                setFieldCounts(countRes.data.data);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    // Lazily fetch field details when a row is expanded
    const toggleExpand = async (email) => {
        if (expandedUser === email) {
            setExpandedUser(null);
            return;
        }
        setExpandedUser(email);

        // Only fetch if not already loaded
        if (fieldDetails[email]) return;

        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/fields/${email}`);
            if (res.data.status === 'success') {
                setFieldDetails(prev => ({ ...prev, [email]: res.data.data }));
            }
        } catch (err) {
            console.error('Error fetching fields for', email, err);
        }
    };

    const handleRemove = async (id) => {
        if (!window.confirm('Are you sure you want to permanently remove this user and all their data?')) return;
        try {
            const res = await axios.delete(`${import.meta.env.VITE_API_URL}/admin/delete-user/${id}`);
            if (res.data.status === 'success') {
                setUsers(prev => prev.filter(u => u._id !== id));
            } else {
                alert('Failed to delete user: ' + res.data.message);
            }
        } catch (err) {
            alert('Server error during deletion.');
        }
    };

    // Pagination
    const totalPages     = Math.ceil(users.length / ITEMS_PER_PAGE);
    const indexOfLast    = currentPage * ITEMS_PER_PAGE;
    const indexOfFirst   = indexOfLast - ITEMS_PER_PAGE;
    const currentUsers   = users.slice(indexOfFirst, indexOfLast);

    return (
        <div>
            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h3 className="text-secondary fw-bold mb-1">Users Management</h3>
                    <p className="text-muted small mb-0">
                        {users.length} registered farmer{users.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3" style={{ backgroundColor: '#f0fdf4' }}>
                        <div className="small text-muted mb-1">Total Farmers</div>
                        <div className="fw-bold fs-3" style={{ color: '#166534' }}>{users.length}</div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3" style={{ backgroundColor: '#f0fdf4' }}>
                        <div className="small text-muted mb-1">Verified Accounts</div>
                        <div className="fw-bold fs-3" style={{ color: '#166534' }}>
                            {users.filter(u => u.isVerified).length}
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3" style={{ backgroundColor: '#f0fdf4' }}>
                        <div className="small text-muted mb-1">Total Fields Configured</div>
                        <div className="fw-bold fs-3" style={{ color: '#166534' }}>
                            {Object.values(fieldCounts).reduce((sum, n) => sum + n, 0)}
                        </div>
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0 align-middle">
                            <thead>
                                <tr>
                                    <th className="py-3 ps-4 text-white border-0" style={{ backgroundColor: '#1a4d3e' }}>Farmer</th>
                                    <th className="py-3 text-white border-0" style={{ backgroundColor: '#1a4d3e' }}>Email</th>
                                    <th className="py-3 text-white border-0" style={{ backgroundColor: '#1a4d3e' }}>Phone</th>
                                    <th className="py-3 text-center text-white border-0" style={{ backgroundColor: '#1a4d3e' }}>Fields</th>
                                    <th className="py-3 text-center text-white border-0" style={{ backgroundColor: '#1a4d3e' }}>Status</th>
                                    <th className="py-3 text-end pe-4 text-white border-0" style={{ backgroundColor: '#1a4d3e' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5 text-muted">
                                            <div className="spinner-border spinner-border-sm text-success me-2" />
                                            Loading farmers...
                                        </td>
                                    </tr>
                                ) : currentUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5 text-muted">
                                            <FaUserAlt style={{ fontSize: '2rem', opacity: 0.2, display: 'block', margin: '0 auto 8px' }} />
                                            No farmers registered yet.
                                        </td>
                                    </tr>
                                ) : (
                                    currentUsers.map((user) => (
                                        <React.Fragment key={user._id}>
                                            {/* MAIN ROW */}
                                            <tr style={{ borderBottom: expandedUser === user.email ? 'none' : '1px solid #f0f0f0' }}>
                                                <td className="ps-4 py-3">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="rounded-circle d-flex align-items-center justify-content-center bg-light text-secondary fw-bold"
                                                            style={{ width: '36px', height: '36px', fontSize: '0.85rem', flexShrink: 0 }}>
                                                            {user.firstName?.[0]}{user.lastName?.[0]}
                                                        </div>
                                                        <span className="fw-bold text-secondary">
                                                            {user.firstName} {user.lastName}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="text-muted" style={{ fontSize: '0.85rem' }}>{user.email}</td>
                                                <td className="text-muted" style={{ fontSize: '0.85rem' }}>{user.phone || '—'}</td>
                                                <td className="text-center">
                                                    {/* Clickable field count — expands to show field details */}
                                                    <button
                                                        className="btn btn-sm d-inline-flex align-items-center gap-1 fw-bold"
                                                        style={{
                                                            backgroundColor: '#f0fdf4',
                                                            color: '#166534',
                                                            border: '1px solid #86efac',
                                                            fontSize: '0.78rem',
                                                            borderRadius: '20px',
                                                            padding: '3px 10px',
                                                        }}
                                                        onClick={() => toggleExpand(user.email)}
                                                    >
                                                        <FaLeaf size={10} />
                                                        {fieldCounts[user.email] ?? '—'}
                                                        {expandedUser === user.email
                                                            ? <FaChevronUp size={9} />
                                                            : <FaChevronDown size={9} />}
                                                    </button>
                                                </td>
                                                <td className="text-center">
                                                    {user.isVerified ? (
                                                        <span className="d-inline-flex align-items-center gap-1 badge"
                                                            style={{ backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #86efac', fontSize: '0.7rem', padding: '4px 8px' }}>
                                                            <FaCheckCircle size={10} /> Verified
                                                        </span>
                                                    ) : (
                                                        <span className="badge"
                                                            style={{ backgroundColor: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a', fontSize: '0.7rem', padding: '4px 8px' }}>
                                                            Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-end pe-4">
                                                    <button
                                                        onClick={() => handleRemove(user._id)}
                                                        className="btn btn-sm d-inline-flex align-items-center gap-1"
                                                        style={{
                                                            backgroundColor: '#fff5f5',
                                                            color: '#dc2626',
                                                            border: '1px solid #fca5a5',
                                                            fontSize: '0.78rem',
                                                            borderRadius: '6px',
                                                        }}
                                                    >
                                                        <FaTrash size={11} /> Remove
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* EXPANDED FIELD DETAILS ROW */}
                                            {expandedUser === user.email && (
                                                <tr style={{ backgroundColor: '#f8fafc' }}>
                                                    <td colSpan="6" className="px-4 pb-3 pt-0">
                                                        <div className="pt-2 pb-1">
                                                            <div className="small fw-bold text-muted mb-2 d-flex align-items-center gap-1">
                                                                <FaLeaf size={11} style={{ color: '#10b981' }} />
                                                                Configured Fields for {user.firstName}
                                                            </div>
                                                            {!fieldDetails[user.email] ? (
                                                                <div className="text-muted small">
                                                                    <div className="spinner-border spinner-border-sm text-success me-2" style={{ width: '12px', height: '12px' }} />
                                                                    Loading fields...
                                                                </div>
                                                            ) : fieldDetails[user.email].length === 0 ? (
                                                                <div className="text-muted small fst-italic">No fields configured yet.</div>
                                                            ) : (
                                                                <div className="d-flex flex-wrap gap-2">
                                                                    {fieldDetails[user.email].map(field => (
                                                                        <div key={field._id}
                                                                            className="px-3 py-2 rounded-3 small"
                                                                            style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', minWidth: '180px' }}>
                                                                            <div className="fw-bold text-dark mb-1">{field.fieldName}</div>
                                                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                                                🌾 {field.cropType || '—'} &nbsp;·&nbsp;
                                                                                🌱 {field.seedlingStage
                                                                                    ? field.seedlingStage.length > 15
                                                                                        ? field.seedlingStage.slice(0, 15) + '…'
                                                                                        : field.seedlingStage
                                                                                    : '—'}
                                                                            </div>
                                                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                                                🪨 {field.soilType || '—'}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))
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

export default AdminUsersPage;