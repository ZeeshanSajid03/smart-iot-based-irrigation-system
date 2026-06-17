import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaBell, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const NotificationBell = ({ userEmail }) => {
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        if (!userEmail) return;
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/notifications/${userEmail}`);
            if (res.data.status === "success") {
                setNotifications(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [userEmail]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id, isRead) => {
        if (isRead) return;
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/notifications/read/${id}`);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        // position:relative wrapper — sized to fit naturally in a flex row
        <div title="View Notifications" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }} ref={dropdownRef}>

            {/* Bell button — fixed square so it never stretches */}
            <button
                onClick={() => setShowDropdown(prev => !prev)}
                style={{
                    width: '38px',
                    height: '38px',
                    flexShrink: 0,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    padding: 0,
                }}
            >
                <FaBell size={16} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        background: '#ef4444',
                        color: '#fff',
                        borderRadius: '50%',
                        fontSize: '0.6rem',
                        fontWeight: 'bold',
                        minWidth: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1,
                        padding: '0 3px',
                        border: '1.5px solid rgba(0,0,0,0.3)',
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: 0,
                    width: '340px',
                    maxHeight: '480px',
                    background: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.18)',
                    zIndex: 1100,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                }}>
                    {/* Header */}
                    <div style={{
                        background: '#10b981',
                        padding: '14px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexShrink: 0,
                    }}>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                            Notifications
                        </span>
                        <span style={{
                            background: '#fff',
                            color: '#10b981',
                            borderRadius: '999px',
                            padding: '1px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                        }}>
                            {unreadCount} New
                        </span>
                    </div>

                    {/* List */}
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {notifications.length > 0 ? (
                            notifications.map((note) => (
                                <div
                                    key={note._id}
                                    onClick={() => handleMarkAsRead(note._id, note.isRead)}
                                    style={{
                                        padding: '12px 16px',
                                        borderBottom: '1px solid #f1f5f9',
                                        cursor: 'pointer',
                                        background: note.isRead ? '#fff' : '#f0fdf4',
                                        transition: 'background 0.15s',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{
                                            fontSize: '0.82rem',
                                            fontWeight: note.isRead ? 400 : 700,
                                            color: note.isRead ? '#64748b' : '#1e293b',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                        }}>
                                            {!note.isRead && (
                                                <FaExclamationCircle style={{ color: '#f59e0b', fontSize: '0.75rem', flexShrink: 0 }} />
                                            )}
                                            {note.header}
                                        </span>
                                        <span style={{ fontSize: '0.68rem', color: '#94a3b8', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                                            {new Date(note.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                                        {note.message}
                                    </p>

                                    {note.image && (
                                        <div style={{ marginTop: '8px', borderRadius: '8px', overflow: 'hidden', background: '#0f172a', textAlign: 'center' }}>
                                            <img
                                                src={note.image}
                                                alt="Notification"
                                                style={{ maxHeight: '110px', objectFit: 'contain', width: '100%' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8' }}>
                                <FaCheckCircle style={{ fontSize: '2rem', opacity: 0.25, marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
                                <span style={{ fontSize: '0.82rem' }}>You're all caught up!</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;