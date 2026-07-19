import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaBell, FaCheckCircle, FaExclamationCircle, FaTrash } from 'react-icons/fa';

const NotificationBell = ({ userEmail }) => {
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown]   = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState({});
    const [deletingId, setDeletingId]       = useState(null); // tracks which is being deleted
    const [clearingAll, setClearingAll]     = useState(false);
    const dropdownRef = useRef(null);
    const bellRef     = useRef(null);

    const fetchNotifications = async () => {
        if (!userEmail) return;
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/notifications/${userEmail}`);
            if (res.data.status === "success") setNotifications(res.data.data);
        } catch (err) {
            console.error("Error fetching notifications:", err);
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

    const calculateDropdownStyle = () => {
        if (!bellRef.current) return {};
        const bell      = bellRef.current.getBoundingClientRect();
        const viewportW = window.innerWidth;
        const dropdownW = Math.min(340, viewportW - 16);
        const MARGIN    = 8;
        let rightOffset = viewportW - bell.right;
        const leftEdge  = viewportW - rightOffset - dropdownW;
        if (leftEdge < MARGIN) rightOffset = viewportW - dropdownW - MARGIN;
        return {
            position:  'fixed',
            top:       bell.bottom + 10,
            right:     Math.max(MARGIN, rightOffset),
            width:     dropdownW,
            maxHeight: '70vh',
        };
    };

    const handleBellClick = () => {
        if (!showDropdown) setDropdownStyle(calculateDropdownStyle());
        setShowDropdown(prev => !prev);
    };

    const handleMarkAsRead = async (id, isRead) => {
        if (isRead) return;
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/notifications/read/${id}`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error("Error marking as read:", err);
        }
    };

    const handleDelete = async (e, id) => {
        // Stop click from bubbling to the row (which would mark as read)
        e.stopPropagation();
        setDeletingId(id);
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/notifications/delete/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (err) {
            console.error("Error deleting notification:", err);
        } finally {
            setDeletingId(null);
        }
    };

    const handleClearAll = async () => {
        if (!userEmail) return;
        setClearingAll(true);
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/notifications/clear/${userEmail}`);
            setNotifications([]);
        } catch (err) {
            console.error("Error clearing notifications:", err);
        } finally {
            setClearingAll(false);
        }
    };

    const handleMarkAllRead = async () => {
        const unread = notifications.filter(n => !n.isRead);
        if (unread.length === 0) return;
        try {
            await Promise.all(
                unread.map(n => axios.put(`${import.meta.env.VITE_API_URL}/api/notifications/read/${n._id}`))
            );
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error("Error marking all read:", err);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div
            title="View Notifications"
            style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
            ref={dropdownRef}
        >
            {/* Bell button */}
            <button
                ref={bellRef}
                onClick={handleBellClick}
                style={{
                    width: '38px', height: '38px', flexShrink: 0,
                    borderRadius: '50%', border: 'none',
                    background: showDropdown ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', position: 'relative', padding: 0,
                    transition: 'background 0.2s',
                }}
            >
                <FaBell size={16} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: '2px', right: '2px',
                        background: '#ef4444', color: '#fff',
                        borderRadius: '50%', fontSize: '0.6rem', fontWeight: 'bold',
                        minWidth: '16px', height: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        lineHeight: 1, padding: '0 3px',
                        border: '1.5px solid rgba(0,0,0,0.3)',
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <div style={{
                    ...dropdownStyle,
                    background: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.18)',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                }}>

                    {/* ── Header ─────────────────────────────────────────── */}
                    <div style={{
                        background: '#10b981', padding: '12px 14px',
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', flexShrink: 0,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                                Notifications
                            </span>
                            {unreadCount > 0 && (
                                <span style={{
                                    background: '#fff', color: '#10b981',
                                    borderRadius: '999px', padding: '1px 8px',
                                    fontSize: '0.72rem', fontWeight: 700,
                                }}>
                                    {unreadCount} New
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => setShowDropdown(false)}
                            style={{
                                background: 'rgba(255,255,255,0.2)', border: 'none',
                                borderRadius: '50%', color: '#fff',
                                width: '26px', height: '26px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.8rem', padding: 0, flexShrink: 0,
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* ── Action bar (only shown when there are notifications) ── */}
                    {notifications.length > 0 && (
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '8px 14px',
                            borderBottom: '1px solid #f1f5f9',
                            backgroundColor: '#f8fafc',
                        }}>
                            {/* Mark all read */}
                            <button
                                onClick={handleMarkAllRead}
                                disabled={unreadCount === 0}
                                style={{
                                    background: 'none', border: 'none', padding: '4px 0',
                                    fontSize: '0.72rem', fontWeight: 600, cursor: unreadCount === 0 ? 'default' : 'pointer',
                                    color: unreadCount === 0 ? '#cbd5e1' : '#10b981',
                                    transition: 'color 0.2s',
                                }}
                            >
                                ✓ Mark all read
                            </button>

                            {/* Clear all */}
                            <button
                                onClick={handleClearAll}
                                disabled={clearingAll}
                                style={{
                                    background: 'none', border: 'none', padding: '4px 0',
                                    fontSize: '0.72rem', fontWeight: 600,
                                    color: '#ef4444', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    opacity: clearingAll ? 0.5 : 1,
                                    transition: 'opacity 0.2s',
                                }}
                            >
                                <FaTrash size={10} />
                                {clearingAll ? 'Clearing...' : 'Clear all'}
                            </button>
                        </div>
                    )}

                    {/* ── Notification list ──────────────────────────────── */}
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {notifications.length > 0 ? (
                            notifications.map((note) => (
                                <div
                                    key={note._id}
                                    onClick={() => handleMarkAsRead(note._id, note.isRead)}
                                    style={{
                                        padding: '10px 14px',
                                        borderBottom: '1px solid #f1f5f9',
                                        cursor: 'pointer',
                                        background: note.isRead ? '#fff' : '#f0fdf4',
                                        transition: 'background 0.15s',
                                        display: 'flex',
                                        gap: '10px',
                                        alignItems: 'flex-start',
                                        // Slide out animation when deleting
                                        opacity: deletingId === note._id ? 0 : 1,
                                        transform: deletingId === note._id ? 'translateX(20px)' : 'translateX(0)',
                                        transition: 'opacity 0.2s, transform 0.2s, background 0.15s',
                                    }}
                                >
                                    {/* Unread dot */}
                                    <div style={{ flexShrink: 0, marginTop: '4px' }}>
                                        {!note.isRead
                                            ? <FaExclamationCircle style={{ color: '#f59e0b', fontSize: '0.75rem' }} />
                                            : <div style={{ width: '12px' }} />
                                        }
                                    </div>

                                    {/* Content */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3px', gap: '8px' }}>
                                            <span style={{
                                                fontSize: '0.82rem',
                                                fontWeight: note.isRead ? 500 : 700,
                                                color: note.isRead ? '#64748b' : '#1e293b',
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            }}>
                                                {note.header}
                                            </span>
                                            <span style={{ fontSize: '0.65rem', color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                {new Date(note.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '0.76rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                                            {note.message}
                                        </p>
                                        {note.image && (
                                            <div style={{ marginTop: '6px', borderRadius: '6px', overflow: 'hidden', background: '#0f172a' }}>
                                                <img src={note.image} alt="Notification" style={{ maxHeight: '90px', objectFit: 'contain', width: '100%' }} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Delete button */}
                                    <button
                                        onClick={(e) => handleDelete(e, note._id)}
                                        disabled={deletingId === note._id}
                                        title="Delete notification"
                                        style={{
                                            flexShrink: 0, marginTop: '2px',
                                            background: 'none', border: 'none', padding: '4px',
                                            borderRadius: '6px',
                                            color: '#cbd5e1', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'color 0.15s, background 0.15s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fff1f2'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.background = 'none'; }}
                                    >
                                        <FaTrash size={11} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8' }}>
                                <FaCheckCircle style={{ fontSize: '2rem', opacity: 0.25, display: 'block', margin: '0 auto 8px' }} />
                                <span style={{ fontSize: '0.82rem' }}>You're all caught up!</span>
                            </div>
                        )}
                    </div>

                    {/* ── Footer count ───────────────────────────────────── */}
                    {notifications.length > 0 && (
                        <div style={{
                            padding: '8px 14px', borderTop: '1px solid #f1f5f9',
                            backgroundColor: '#f8fafc', flexShrink: 0,
                            fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center',
                        }}>
                            {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                            {unreadCount > 0 ? ` · ${unreadCount} unread` : ' · all read'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;