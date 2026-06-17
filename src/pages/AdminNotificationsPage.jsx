import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
    FaPaperPlane, FaImage, FaUsers, FaTimes,
    FaUser, FaBroadcastTower, FaCheckCircle, FaBell
} from 'react-icons/fa';

// ── TOAST ─────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, visible }) => (
    <div style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
        background: type === 'success'
            ? 'linear-gradient(135deg, #064e3b, #065f46)'
            : 'linear-gradient(135deg, #991b1b, #b91c1c)',
        color: '#fff', borderRadius: '14px', padding: '13px 20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
        display: 'flex', alignItems: 'center', gap: '10px',
        fontSize: '0.85rem', fontWeight: 600,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(70px) scale(0.95)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        pointerEvents: 'none',
        minWidth: '240px',
    }}>
        {type === 'success'
            ? <FaCheckCircle style={{ flexShrink: 0, fontSize: '1rem' }} />
            : <FaBell style={{ flexShrink: 0, fontSize: '1rem' }} />}
        {message}
    </div>
);

// ── USER CHIP (selected user preview) ────────────────────────────────────────
const UserChip = ({ user, onRemove }) => (
    <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        background: 'linear-gradient(135deg, #064e3b, #065f46)',
        borderRadius: '30px', padding: '6px 12px 6px 8px',
        color: '#fff', fontSize: '0.82rem', fontWeight: 600,
        animation: 'chipIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
        <div style={{
            width: '24px', height: '24px', borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
        }}>
            {user.firstName?.[0]}{user.lastName?.[0]}
        </div>
        {user.firstName} {user.lastName}
        <button onClick={onRemove} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
            color: '#fff', width: '18px', height: '18px', padding: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
            <FaTimes size={9} />
        </button>
    </div>
);

// ── CHAR COUNTER ──────────────────────────────────────────────────────────────
const CharCounter = ({ current, max }) => {
    const pct   = current / max;
    const color = pct > 0.9 ? '#dc2626' : pct > 0.7 ? '#d97706' : '#10b981';
    return (
        <span style={{ fontSize: '0.7rem', color, fontWeight: 600, transition: 'color 0.2s' }}>
            {current}/{max}
        </span>
    );
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
const AdminNotificationsPage = () => {
    const [userList, setUserList]             = useState([]);
    const [sendToAll, setSendToAll]           = useState(false);
    const [selectedUser, setSelectedUser]     = useState(null);   // full user object
    const [header, setHeader]                 = useState('');
    const [message, setMessage]               = useState('');
    const [imageBase64, setImageBase64]       = useState(null);
    const [loading, setLoading]               = useState(false);
    const [sent, setSent]                     = useState(false);  // success state
    const [toast, setToast]                   = useState({ visible: false, message: '', type: 'success' });
    const [searchQuery, setSearchQuery]       = useState('');
    const [showUserDropdown, setShowUserDropdown] = useState(false);

    const dropdownRef  = useRef(null);
    const fileInputRef = useRef(null);

    const MAX_HEADER  = 80;
    const MAX_MESSAGE = 500;

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(t => ({ ...t, visible: false })), 3500);
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/users`);
                if (res.data.status === "success") {
                    setUserList((res.data.data || []).filter(u => u.role === 'user'));
                }
            } catch (err) {
                console.error("Failed to fetch users", err);
            }
        };
        fetchUsers();
    }, []);

    // Close user search dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowUserDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filteredUsers = userList.filter(u =>
        `${u.firstName} ${u.lastName} ${u.email}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
    );

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2000000) {
            showToast('Image too large. Max size is 2MB.', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setImageBase64(reader.result);
        reader.readAsDataURL(file);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!sendToAll && !selectedUser) {
            showToast('Please select a recipient or enable Broadcast Mode.', 'error');
            return;
        }
        if (!header.trim() || !message.trim()) {
            showToast('Header and message are required.', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/notifications/send`, {
                target:  sendToAll ? 'ALL' : selectedUser.email,
                header:  header.trim(),
                message: message.trim(),
                image:   imageBase64,
            });

            if (res.data.status === "success") {
                setSent(true);
                showToast(
                    sendToAll
                        ? `Broadcast sent to all ${userList.length} farmers.`
                        : `Notification sent to ${selectedUser.firstName}.`
                );
                // Reset after showing success state briefly
                setTimeout(() => {
                    setSent(false);
                    setHeader('');
                    setMessage('');
                    setImageBase64(null);
                    setSelectedUser(null);
                    setSendToAll(false);
                    setSearchQuery('');
                }, 2000);
            } else {
                showToast(res.data.message || 'Failed to send.', 'error');
            }
        } catch (err) {
            console.error("Send error:", err);
            showToast('Server error. Try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const isReady = (sendToAll || selectedUser) && header.trim() && message.trim();

    return (
        <div style={{ minHeight: '100%', backgroundColor: '#f8fafc' }}>
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes chipIn {
                    from { opacity: 0; transform: scale(0.7); }
                    to   { opacity: 1; transform: scale(1); }
                }
                @keyframes successPop {
                    0%   { transform: scale(0.8); opacity: 0; }
                    60%  { transform: scale(1.05); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes shimmer {
                    0%   { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                .notif-card { animation: fadeUp 0.4s ease both; }
                .notif-card:nth-child(1) { animation-delay: 0.05s; }
                .notif-card:nth-child(2) { animation-delay: 0.12s; }
                .notif-card:nth-child(3) { animation-delay: 0.19s; }
                .user-search-result:hover {
                    background: #f0fdf4 !important;
                    cursor: pointer;
                }
                .send-btn-ready {
                    background: linear-gradient(135deg, #064e3b, #065f46, #047857);
                    background-size: 200% auto;
                    transition: background-position 0.5s, transform 0.15s, box-shadow 0.2s;
                }
                .send-btn-ready:hover {
                    background-position: right center;
                    transform: translateY(-1px);
                    box-shadow: 0 8px 24px rgba(6,78,59,0.35) !important;
                }
                .send-btn-ready:active { transform: translateY(0); }
                .img-drop-zone:hover { border-color: #10b981 !important; background: #f0fdf4 !important; }
            `}</style>

            {/* PAGE HEADER */}
            <div style={{ marginBottom: '28px', animation: 'fadeUp 0.3s ease' }}>
                <h2 className="fw-bold mb-1" style={{ color: '#064e3b' }}>Push Notifications</h2>
                <p className="text-muted small mb-0">
                    Send targeted alerts or broadcast system updates to your farmers.
                </p>
            </div>

            <div className="row g-4 align-items-start">

                {/* ── LEFT: COMPOSE FORM ──────────────────────────────────── */}
                <div className="col-lg-7 notif-card">
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">

                        {/* Card header bar */}
                        <div style={{
                            background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
                            padding: '20px 24px',
                            display: 'flex', alignItems: 'center', gap: '12px',
                        }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '10px',
                                backgroundColor: 'rgba(255,255,255,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                                <FaPaperPlane style={{ color: '#6ee7b7', fontSize: '1rem' }} />
                            </div>
                            <div>
                                <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>Compose Message</div>
                                <div style={{ color: '#6ee7b7', fontSize: '0.75rem' }}>Fill in the details below and choose your audience</div>
                            </div>
                        </div>

                        <div style={{ padding: '28px' }}>
                            <form onSubmit={handleSend}>

                                {/* ── AUDIENCE SELECTOR ─────────────────── */}
                                <div style={{ marginBottom: '24px' }}>
                                    <label className="fw-bold small text-dark mb-3 d-flex align-items-center gap-2">
                                        <FaUsers style={{ color: '#10b981' }} /> Audience
                                    </label>

                                    {/* Broadcast toggle */}
                                    <div
                                        onClick={() => { setSendToAll(p => !p); setSelectedUser(null); setSearchQuery(''); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
                                            background: sendToAll
                                                ? 'linear-gradient(135deg, #064e3b, #065f46)'
                                                : '#f8fafc',
                                            border: `1.5px solid ${sendToAll ? 'transparent' : '#e2e8f0'}`,
                                            transition: 'all 0.3s ease', marginBottom: '12px',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '10px',
                                                backgroundColor: sendToAll ? 'rgba(255,255,255,0.15)' : '#dcfce7',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <FaBroadcastTower style={{ color: sendToAll ? '#6ee7b7' : '#10b981', fontSize: '0.95rem' }} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: sendToAll ? '#ecfdf5' : '#1e293b' }}>
                                                    Broadcast to All Farmers
                                                </div>
                                                <div style={{ fontSize: '0.72rem', color: sendToAll ? '#6ee7b7' : '#6b7280', marginTop: '1px' }}>
                                                    {sendToAll
                                                        ? `Will reach ${userList.length} registered farmer${userList.length !== 1 ? 's' : ''}`
                                                        : 'Send to every registered farmer at once'}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{
                                            width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                                            backgroundColor: sendToAll ? '#10b981' : '#e2e8f0',
                                            border: `2px solid ${sendToAll ? '#6ee7b7' : '#cbd5e1'}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.2s',
                                        }}>
                                            {sendToAll && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />}
                                        </div>
                                    </div>

                                    {/* OR divider */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0' }}>
                                        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>OR TARGET SPECIFIC</span>
                                        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                                    </div>

                                    {/* User search */}
                                    <div style={{ position: 'relative', marginTop: '8px' }} ref={dropdownRef}>
                                        <div style={{ position: 'relative' }}>
                                            <FaUser style={{
                                                position: 'absolute', left: '14px', top: '50%',
                                                transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.8rem',
                                            }} />
                                            <input
                                                type="text"
                                                placeholder={sendToAll ? 'Broadcast mode active' : 'Search farmer by name or email...'}
                                                value={searchQuery}
                                                onChange={e => { setSearchQuery(e.target.value); setShowUserDropdown(true); }}
                                                onFocus={() => setShowUserDropdown(true)}
                                                disabled={sendToAll}
                                                style={{
                                                    width: '100%', padding: '10px 14px 10px 38px',
                                                    borderRadius: '10px', border: '1.5px solid #e2e8f0',
                                                    fontSize: '0.85rem', outline: 'none',
                                                    backgroundColor: sendToAll ? '#f8fafc' : '#fff',
                                                    color: sendToAll ? '#94a3b8' : '#1e293b',
                                                    transition: 'border-color 0.2s',
                                                }}
                                                onFocusCapture={e => !sendToAll && (e.target.style.borderColor = '#10b981')}
                                                onBlurCapture={e => (e.target.style.borderColor = '#e2e8f0')}
                                            />
                                        </div>

                                        {/* Search results dropdown */}
                                        {showUserDropdown && !sendToAll && searchQuery && (
                                            <div style={{
                                                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                                                background: '#fff', borderRadius: '12px', zIndex: 500,
                                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                                border: '1px solid #e2e8f0', overflow: 'hidden',
                                                maxHeight: '200px', overflowY: 'auto',
                                            }}>
                                                {filteredUsers.length === 0 ? (
                                                    <div style={{ padding: '14px', fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center' }}>
                                                        No farmers found
                                                    </div>
                                                ) : filteredUsers.map(user => (
                                                    <div
                                                        key={user._id}
                                                        className="user-search-result"
                                                        style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.15s' }}
                                                        onMouseDown={() => {
                                                            setSelectedUser(user);
                                                            setSearchQuery('');
                                                            setShowUserDropdown(false);
                                                        }}
                                                    >
                                                        <div style={{
                                                            width: '30px', height: '30px', borderRadius: '50%',
                                                            backgroundColor: '#064e3b', color: '#fff',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: '0.72rem', fontWeight: 700, flexShrink: 0,
                                                        }}>
                                                            {user.firstName?.[0]}{user.lastName?.[0]}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
                                                                {user.firstName} {user.lastName}
                                                            </div>
                                                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{user.email}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected user chip */}
                                    {selectedUser && !sendToAll && (
                                        <div style={{ marginTop: '10px' }}>
                                            <UserChip
                                                user={selectedUser}
                                                onRemove={() => setSelectedUser(null)}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* ── HEADER INPUT ──────────────────────── */}
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <label className="fw-bold small text-dark">Notification Title</label>
                                        <CharCounter current={header.length} max={MAX_HEADER} />
                                    </div>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g., ⚠️ Low Moisture Alert — Zone B"
                                        value={header}
                                        onChange={e => e.target.value.length <= MAX_HEADER && setHeader(e.target.value)}
                                        style={{ borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem' }}
                                    />
                                </div>

                                {/* ── MESSAGE TEXTAREA ──────────────────── */}
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <label className="fw-bold small text-dark">Message Body</label>
                                        <CharCounter current={message.length} max={MAX_MESSAGE} />
                                    </div>
                                    <textarea
                                        className="form-control"
                                        rows="4"
                                        placeholder="Describe the alert or update in detail..."
                                        value={message}
                                        onChange={e => e.target.value.length <= MAX_MESSAGE && setMessage(e.target.value)}
                                        style={{ borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', resize: 'vertical', minHeight: '100px' }}
                                    />
                                </div>

                                {/* ── IMAGE UPLOAD ──────────────────────── */}
                                <div style={{ marginBottom: '28px' }}>
                                    <label className="fw-bold small text-dark mb-2 d-flex align-items-center gap-2">
                                        <FaImage style={{ color: '#10b981' }} /> Attach Image
                                        <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional, max 2MB)</span>
                                    </label>

                                    {!imageBase64 ? (
                                        <div
                                            className="img-drop-zone"
                                            style={{
                                                border: '2px dashed #cbd5e1', borderRadius: '12px',
                                                padding: '24px', textAlign: 'center',
                                                cursor: 'pointer', transition: 'all 0.2s',
                                                backgroundColor: '#fafbfc',
                                            }}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                style={{ display: 'none' }}
                                                accept=".jpg,.jpeg,.png,.webp"
                                                onChange={handleImageUpload}
                                            />
                                            <FaImage style={{ fontSize: '1.8rem', color: '#cbd5e1', marginBottom: '8px' }} />
                                            <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>
                                                Click to upload
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '3px' }}>
                                                JPG, PNG, WEBP supported
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                            <img
                                                src={imageBase64} alt="Preview"
                                                style={{ maxHeight: '160px', maxWidth: '100%', borderRadius: '12px',
                                                    objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setImageBase64(null)}
                                                style={{
                                                    position: 'absolute', top: '-8px', right: '-8px',
                                                    background: '#dc2626', border: 'none', borderRadius: '50%',
                                                    color: '#fff', width: '24px', height: '24px', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                                }}
                                            >
                                                <FaTimes size={11} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* ── SEND BUTTON ───────────────────────── */}
                                <button
                                    type="submit"
                                    disabled={loading || !isReady}
                                    className={isReady ? 'send-btn-ready' : ''}
                                    style={{
                                        width: '100%', padding: '14px',
                                        border: 'none', borderRadius: '12px',
                                        color: '#fff', fontWeight: 700, fontSize: '0.92rem',
                                        cursor: isReady ? 'pointer' : 'not-allowed',
                                        background: !isReady
                                            ? '#cbd5e1'
                                            : sent
                                            ? '#10b981'
                                            : undefined,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                        transition: 'background 0.3s',
                                        animation: sent ? 'successPop 0.4s ease' : 'none',
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <div className="spinner-border spinner-border-sm" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                                            Sending...
                                        </>
                                    ) : sent ? (
                                        <>
                                            <FaCheckCircle size={16} />
                                            Sent Successfully!
                                        </>
                                    ) : (
                                        <>
                                            <FaPaperPlane size={14} />
                                            {sendToAll
                                                ? `Broadcast to All ${userList.length} Farmers`
                                                : selectedUser
                                                ? `Send to ${selectedUser.firstName} ${selectedUser.lastName}`
                                                : 'Send Notification'}
                                        </>
                                    )}
                                </button>

                            </form>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: STATS + TIPS ──────────────────────────────────── */}
                <div className="col-lg-5 notif-card" style={{ animationDelay: '0.08s' }}>

                    {/* Audience summary card */}
                    <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                        <div style={{
                            background: 'linear-gradient(135deg, #064e3b, #065f46)',
                            padding: '18px 22px',
                        }}>
                            <div style={{ color: '#6ee7b7', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                                Audience Overview
                            </div>
                            <div style={{ color: '#fff', fontWeight: 800, fontSize: '2rem', lineHeight: 1 }}>
                                {userList.length}
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem' }}>
                                registered farmers
                            </div>
                        </div>
                        <div style={{ padding: '16px 22px', backgroundColor: '#f0fdf4' }}>
                            {[
                                { label: 'Verified accounts', value: userList.filter(u => u.isVerified).length, color: '#059669' },
                                { label: 'Pending verification', value: userList.filter(u => !u.isVerified).length, color: '#d97706' },
                            ].map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '8px 0', borderBottom: i === 0 ? '1px solid #dcfce7' : 'none',
                                }}>
                                    <span style={{ fontSize: '0.82rem', color: '#374151' }}>{item.label}</span>
                                    <span style={{ fontWeight: 700, color: item.color, fontSize: '0.9rem' }}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Preview card */}
                    <div className="card border-0 shadow-sm rounded-4 mb-4">
                        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f1f5f9' }}>
                            <div className="fw-bold text-dark" style={{ fontSize: '0.88rem' }}>Live Preview</div>
                            <div className="text-muted" style={{ fontSize: '0.72rem' }}>How it looks in the notification bell</div>
                        </div>
                        <div style={{ padding: '16px 20px' }}>
                            <div style={{
                                padding: '12px 14px', borderRadius: '10px',
                                backgroundColor: header || message ? '#f0fdf4' : '#f8fafc',
                                border: `1px solid ${header || message ? '#86efac' : '#e2e8f0'}`,
                                transition: 'all 0.3s',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                                        {header || <span style={{ color: '#94a3b8', fontWeight: 400 }}>Notification title...</span>}
                                    </span>
                                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>just now</span>
                                </div>
                                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                                    {message || <span style={{ color: '#cbd5e1' }}>Message body will appear here...</span>}
                                </p>
                                {imageBase64 && (
                                    <div style={{ marginTop: '8px', borderRadius: '6px', overflow: 'hidden' }}>
                                        <img src={imageBase64} alt="Preview" style={{ maxHeight: '80px', width: '100%', objectFit: 'cover' }} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tips card */}
                    <div className="card border-0 shadow-sm rounded-4" style={{ backgroundColor: '#fffbeb' }}>
                        <div style={{ padding: '18px 22px' }}>
                            <div className="fw-bold mb-3" style={{ fontSize: '0.88rem', color: '#92400e' }}>
                                💡 Notification Tips
                            </div>
                            {[
                                'Keep titles short and action-oriented.',
                                'Broadcast mode sends to all verified farmers.',
                                'Images increase engagement — use field photos.',
                                'Farmers see notifications in their bell icon.',
                            ].map((tip, i) => (
                                <div key={i} style={{
                                    display: 'flex', gap: '8px', marginBottom: i < 3 ? '10px' : 0,
                                    fontSize: '0.78rem', color: '#78350f', lineHeight: 1.5,
                                }}>
                                    <span style={{ color: '#d97706', flexShrink: 0, marginTop: '1px' }}>•</span>
                                    {tip}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <Toast message={toast.message} type={toast.type} visible={toast.visible} />
        </div>
    );
};

export default AdminNotificationsPage;