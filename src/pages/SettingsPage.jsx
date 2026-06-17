import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
    FaBell, FaBrain, FaTint, FaThermometerHalf,
    FaTrash, FaSave, FaCheckCircle, FaWater,
    FaSeedling, FaExclamationTriangle
} from 'react-icons/fa';
import { WiHumidity } from 'react-icons/wi';

const SettingSection = ({ icon: Icon, iconColor, title, subtitle, children }) => (
    <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
        <div className="card-header border-0 d-flex align-items-center gap-3 p-4 pb-3"
            style={{ backgroundColor: '#f0fdf4' }}>
            <div className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '42px', height: '42px', backgroundColor: '#dcfce7', border: '1px solid #86efac', flexShrink: 0 }}>
                <Icon style={{ color: iconColor || '#059669', fontSize: '1.1rem' }} />
            </div>
            <div>
                <div className="fw-bold text-dark" style={{ fontSize: '1rem' }}>{title}</div>
                <div className="text-muted small">{subtitle}</div>
            </div>
        </div>
        <div className="card-body p-4" style={{ backgroundColor: '#fff' }}>
            {children}
        </div>
    </div>
);

const Toast = ({ message, type, visible }) => (
    <div style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
        background: type === 'success' ? '#064e3b' : '#991b1b',
        color: '#fff', borderRadius: '12px', padding: '12px 20px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        display: 'flex', alignItems: 'center', gap: '10px',
        fontSize: '0.85rem', fontWeight: 600,
        transform: visible ? 'translateY(0)' : 'translateY(80px)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        pointerEvents: 'none',
    }}>
        {type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
        {message}
    </div>
);

const ThresholdSlider = ({ label, value, onChange, min, max, unit, color, icon: Icon, helperText }) => (
    <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
            <label className="d-flex align-items-center gap-2 fw-bold text-dark small">
                <Icon style={{ color, fontSize: '0.9rem' }} />
                {label}
            </label>
            <span className="badge fw-bold px-3 py-2"
                style={{ backgroundColor: color + '22', color, border: `1px solid ${color}55`, fontSize: '0.82rem' }}>
                {value}{unit}
            </span>
        </div>
        <input type="range" className="form-range" min={min} max={max} step="1"
            value={value} onChange={e => onChange(Number(e.target.value))}
            style={{ accentColor: color }} />
        <div className="d-flex justify-content-between" style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
            <span>{min}{unit}</span>
            <span style={{ color: '#6b7280', fontSize: '0.72rem', fontStyle: 'italic' }}>{helperText}</span>
            <span>{max}{unit}</span>
        </div>
    </div>
);

const AlertRow = ({ id, label, description, checked, onChange }) => (
    <div className="d-flex align-items-center justify-content-between p-3 rounded-3 mb-2"
        style={{ backgroundColor: checked ? '#f0fdf4' : '#f8fafc', border: `1px solid ${checked ? '#86efac' : '#e2e8f0'}`, transition: 'all 0.2s' }}>
        <div>
            <div className="fw-bold small text-dark">{label}</div>
            <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '2px' }}>{description}</div>
        </div>
        <div className="form-check form-switch m-0">
            <input className="form-check-input" type="checkbox" id={id}
                checked={checked} onChange={onChange}
                style={{ transform: 'scale(1.2)', cursor: 'pointer',
                    backgroundColor: checked ? '#10b981' : '', borderColor: checked ? '#10b981' : '' }} />
        </div>
    </div>
);

const SettingsPage = () => {
    const navigate  = useNavigate();
    const [userEmail, setUserEmail] = useState('');
    const [loading, setLoading]     = useState(true);
    const [saving, setSaving]       = useState('');
    const [toast, setToast]         = useState({ visible: false, message: '', type: 'success' });

    // ✅ No lowBattery
    const [alerts, setAlerts] = useState({
        lowMoisture:          true,
        sensorFailure:        true,
        irrigationCompletion: false,
    });

    const [smartMode, setSmartMode]   = useState(false);
    const [thresholds, setThresholds] = useState({
        soilCritical: 20, soilWarning: 35, tempHigh: 38, humidityHigh: 85,
    });
    const [pumpFlowRate, setPumpFlowRate] = useState(15);
    const [deleteStep, setDeleteStep]    = useState(0);
    const [clearStep, setClearStep]      = useState(0);

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
    };

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) return;
        const parsed = JSON.parse(stored);
        setUserEmail(parsed.email);

        const loadSettings = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user-settings/${parsed.email}`);
                if (res.data.status === 'success') {
                    const d = res.data.data;
                    // ✅ Only load the three alerts we care about (drop lowBattery)
                    setAlerts({
                        lowMoisture:          d.alerts?.lowMoisture          ?? true,
                        sensorFailure:        d.alerts?.sensorFailure        ?? true,
                        irrigationCompletion: d.alerts?.irrigationCompletion ?? false,
                    });
                    setSmartMode(d.smartMode ?? false);
                    setThresholds({
                        soilCritical: d.soilCritical ?? 20,
                        soilWarning:  d.soilWarning  ?? 35,
                        tempHigh:     d.tempHigh     ?? 38,
                        humidityHigh: d.humidityHigh ?? 85,
                    });
                    setPumpFlowRate(d.pumpFlowRate ?? 15);
                }
            } catch (err) {
                console.error('Failed to load settings:', err);
                showToast('Could not load settings from server.', 'error');
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const handleSaveAlerts = async () => {
        setSaving('alerts');
        try {
            // Include lowBattery: false when saving so we don't break the DB schema
            const alertsToSave = { ...alerts, lowBattery: false };
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/update-alerts`, {
                email: userEmail, alerts: alertsToSave,
            });
            if (res.data.status === 'success') {
                // ✅ Update localStorage so refresh reflects saved state
                const stored = JSON.parse(localStorage.getItem('user'));
                stored.alerts = res.data.alerts;
                localStorage.setItem('user', JSON.stringify(stored));
                showToast('Alert preferences saved.');
            } else {
                showToast(res.data.message || 'Failed to save.', 'error');
            }
        } catch (err) {
            showToast('Server error. Try again.', 'error');
        } finally {
            setSaving('');
        }
    };

    const handleSmartModeToggle = async () => {
        const newState = !smartMode;
        setSmartMode(newState);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/pump/control`, {
                email: userEmail, action: 'smart', state: newState,
            });
            if (!newState) {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/pump/control`, {
                    email: userEmail, action: 'manual', state: false,
                });
            }
            // ✅ Persist smart mode state to localStorage so refresh shows correct value
            const stored = JSON.parse(localStorage.getItem('user'));
            stored.smartMode = newState;
            localStorage.setItem('user', JSON.stringify(stored));
            showToast(`Smart Mode ${newState ? 'enabled' : 'disabled'}.`);
        } catch (err) {
            setSmartMode(!newState);
            showToast('Failed to update smart mode.', 'error');
        }
    };

    const handleSaveThresholds = async () => {
        if (thresholds.soilWarning <= thresholds.soilCritical) {
            showToast('Warning threshold must be above critical threshold.', 'error');
            return;
        }
        setSaving('thresholds');
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/user-settings`, {
                email: userEmail, pumpFlowRate, ...thresholds,
            });
            if (res.data.status === 'success') {
                showToast('Thresholds and pump settings saved.');
            } else {
                showToast(res.data.message || 'Failed to save.', 'error');
            }
        } catch (err) {
            showToast('Server error. Try again.', 'error');
        } finally {
            setSaving('');
        }
    };

    const handleClearHistory = async () => {
        if (clearStep === 0) { setClearStep(1); return; }
        setClearStep(2);
        try {
            const res = await axios.delete(`${import.meta.env.VITE_API_URL}/api/sensor-data/clear?email=${userEmail}`);
            if (res.data.status === 'success') {
                showToast(res.data.message || 'Sensor history cleared.');
            } else {
                showToast('Failed to clear history.', 'error');
            }
        } catch (err) {
            showToast('Server error while clearing history.', 'error');
        } finally {
            setClearStep(0);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteStep === 0) { setDeleteStep(1); return; }
        setDeleteStep(2);
        try {
            const res = await axios.delete(`${import.meta.env.VITE_API_URL}/api/delete-my-account/${userEmail}`);
            if (res.data.status === 'success') {
                localStorage.removeItem('user');
                navigate('/signup');
            } else {
                showToast('Failed: ' + res.data.message, 'error');
                setDeleteStep(0);
            }
        } catch (err) {
            showToast('Server error. Try again.', 'error');
            setDeleteStep(0);
        }
    };

    if (loading) return (
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
            <div className="text-center">
                <div className="spinner-border text-success mb-3" />
                <div className="text-muted small fw-bold">Loading your settings...</div>
            </div>
        </div>
    );

    return (
        <div className="container-fluid p-3 p-md-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .settings-section { animation: slideIn 0.35s ease forwards; }
                .settings-section:nth-child(1) { animation-delay: 0.05s; opacity: 0; }
                .settings-section:nth-child(2) { animation-delay: 0.10s; opacity: 0; }
                .settings-section:nth-child(3) { animation-delay: 0.15s; opacity: 0; }
                .settings-section:nth-child(4) { animation-delay: 0.20s; opacity: 0; }
                .settings-section:nth-child(5) { animation-delay: 0.25s; opacity: 0; }
            `}</style>

            <div className="mb-4">
                <h2 className="fw-bold mb-0" style={{ color: '#064e3b' }}>Settings</h2>
                <p className="text-muted small mb-0">
                    Configure your irrigation system, alert thresholds, and account preferences.
                </p>
            </div>

            {/* 1. SMART MODE */}
            <div className="settings-section">
                <SettingSection icon={FaBrain} iconColor="#8b5cf6"
                    title="Smart Mode"
                    subtitle="Let the AI model automatically control your pump based on sensor data">
                    <div className="d-flex align-items-center justify-content-between p-4 rounded-3"
                        style={{
                            background: smartMode
                                ? 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)'
                                : '#f8fafc',
                            border: `1px solid ${smartMode ? 'transparent' : '#e2e8f0'}`,
                            transition: 'all 0.4s ease',
                        }}>
                        <div className="d-flex align-items-center gap-3">
                            <div className="rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: '48px', height: '48px',
                                    backgroundColor: smartMode ? 'rgba(255,255,255,0.15)' : '#f0fdf4',
                                    border: `1px solid ${smartMode ? 'rgba(255,255,255,0.2)' : '#86efac'}` }}>
                                <FaBrain style={{ color: smartMode ? '#6ee7b7' : '#8b5cf6', fontSize: '1.2rem' }} />
                            </div>
                            <div>
                                <div className="fw-bold" style={{ color: smartMode ? '#ecfdf5' : '#1e293b', fontSize: '0.95rem' }}>
                                    AI-Controlled Irrigation
                                </div>
                                <div style={{ fontSize: '0.78rem', color: smartMode ? '#6ee7b7' : '#6b7280', marginTop: '2px' }}>
                                    {smartMode
                                        ? '● Active — AI makes predictions every 30 seconds'
                                        : 'Off — Manual pump control is active'}
                                </div>
                            </div>
                        </div>
                        <div className="form-check form-switch m-0">
                            <input className="form-check-input" type="checkbox"
                                checked={smartMode} onChange={handleSmartModeToggle}
                                style={{ transform: 'scale(1.5)', cursor: 'pointer',
                                    backgroundColor: smartMode ? '#10b981' : '',
                                    borderColor: smartMode ? '#10b981' : '' }} />
                        </div>
                    </div>
                    {smartMode && (
                        <div className="mt-3 p-3 rounded-3 d-flex align-items-center gap-2"
                            style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%',
                                backgroundColor: '#10b981', display: 'inline-block',
                                animation: 'pulse 1.5s infinite', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>
                                AI model is running. Pump state is being controlled automatically. Disable to take manual control.
                            </span>
                        </div>
                    )}
                </SettingSection>
            </div>

            {/* 2. ALERT NOTIFICATIONS — no lowBattery */}
            <div className="settings-section">
                <SettingSection icon={FaBell} iconColor="#f59e0b"
                    title="Alert Notifications"
                    subtitle="Choose which events trigger notifications in your dashboard bell">
                    <AlertRow id="alert_moisture" label="Low Soil Moisture"
                        description="Alert when soil moisture drops below your warning threshold"
                        checked={alerts.lowMoisture}
                        onChange={() => setAlerts(p => ({ ...p, lowMoisture: !p.lowMoisture }))} />
                    <AlertRow id="alert_sensor" label="Sensor Offline / Failure"
                        description="Alert when no sensor reading is received for 2+ minutes"
                        checked={alerts.sensorFailure}
                        onChange={() => setAlerts(p => ({ ...p, sensorFailure: !p.sensorFailure }))} />
                    <AlertRow id="alert_completion" label="Irrigation Cycle Complete"
                        description="Alert when the pump turns off after an irrigation session"
                        checked={alerts.irrigationCompletion}
                        onChange={() => setAlerts(p => ({ ...p, irrigationCompletion: !p.irrigationCompletion }))} />
                    <button className="btn fw-bold mt-3 d-flex align-items-center gap-2"
                        style={{ backgroundColor: '#064e3b', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 24px' }}
                        onClick={handleSaveAlerts} disabled={saving === 'alerts'}>
                        {saving === 'alerts'
                            ? <><div className="spinner-border spinner-border-sm me-1" />Saving...</>
                            : <><FaSave />Save Alert Preferences</>}
                    </button>
                </SettingSection>
            </div>

            {/* 3. SENSOR THRESHOLDS */}
            <div className="settings-section">
                <SettingSection icon={FaSeedling} iconColor="#10b981"
                    title="Sensor Alert Thresholds"
                    subtitle="Customize when the system triggers low moisture, heat, and humidity alerts">
                    <div className="row g-4">
                        <div className="col-md-6">
                            <ThresholdSlider label="Critical Soil Moisture"
                                value={thresholds.soilCritical}
                                onChange={v => setThresholds(p => ({ ...p, soilCritical: v }))}
                                min={5} max={40} unit="%" color="#dc2626"
                                icon={FaTint} helperText="Wilting risk below this" />
                        </div>
                        <div className="col-md-6">
                            <ThresholdSlider label="Warning Soil Moisture"
                                value={thresholds.soilWarning}
                                onChange={v => setThresholds(p => ({ ...p, soilWarning: v }))}
                                min={15} max={60} unit="%" color="#d97706"
                                icon={FaTint} helperText="Irrigation recommended" />
                        </div>
                        <div className="col-md-6">
                            <ThresholdSlider label="High Temperature Alert"
                                value={thresholds.tempHigh}
                                onChange={v => setThresholds(p => ({ ...p, tempHigh: v }))}
                                min={28} max={50} unit="°C" color="#f97316"
                                icon={FaThermometerHalf} helperText="Heat stress for crops" />
                        </div>
                        <div className="col-md-6">
                            <ThresholdSlider label="High Humidity Alert"
                                value={thresholds.humidityHigh}
                                onChange={v => setThresholds(p => ({ ...p, humidityHigh: v }))}
                                min={60} max={100} unit="%" color="#0284c7"
                                icon={() => <WiHumidity style={{ color: '#0284c7' }} />}
                                helperText="Fungal disease risk" />
                        </div>
                    </div>
                    {thresholds.soilWarning <= thresholds.soilCritical && (
                        <div className="d-flex align-items-center gap-2 p-3 rounded-3 mb-3"
                            style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}>
                            <FaExclamationTriangle style={{ color: '#d97706' }} />
                            <span style={{ color: '#92400e', fontSize: '0.82rem', fontWeight: 600 }}>
                                Warning threshold must be higher than critical threshold.
                            </span>
                        </div>
                    )}
                    <button className="btn fw-bold mt-2 d-flex align-items-center gap-2"
                        style={{ backgroundColor: '#064e3b', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 24px' }}
                        onClick={handleSaveThresholds}
                        disabled={saving === 'thresholds' || thresholds.soilWarning <= thresholds.soilCritical}>
                        {saving === 'thresholds'
                            ? <><div className="spinner-border spinner-border-sm me-1" />Saving...</>
                            : <><FaSave />Save Thresholds</>}
                    </button>
                </SettingSection>
            </div>

            {/* 4. PUMP FLOW RATE */}
            <div className="settings-section">
                <SettingSection icon={FaWater} iconColor="#0284c7"
                    title="Pump Configuration"
                    subtitle="Set your pump's flow rate to accurately estimate water usage on the dashboard chart">
                    <div style={{ maxWidth: '500px' }}>
                        <ThresholdSlider label="Pump Flow Rate"
                            value={pumpFlowRate} onChange={setPumpFlowRate}
                            min={1} max={60} unit=" L/min" color="#0284c7"
                            icon={FaWater} helperText="Standard pumps: 10–20 L/min" />
                        <div className="p-3 rounded-3 d-flex align-items-start gap-2"
                            style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                            <FaTint style={{ color: '#0284c7', marginTop: '2px', flexShrink: 0 }} />
                            <div style={{ fontSize: '0.78rem', color: '#1e40af' }}>
                                The water usage chart uses this value to calculate litres per session.
                                If unsure, 15 L/min is a safe default for standard agricultural pumps.
                            </div>
                        </div>
                    </div>
                    <button className="btn fw-bold mt-3 d-flex align-items-center gap-2"
                        style={{ backgroundColor: '#064e3b', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 24px' }}
                        onClick={handleSaveThresholds} disabled={saving === 'thresholds'}>
                        {saving === 'thresholds'
                            ? <><div className="spinner-border spinner-border-sm me-1" />Saving...</>
                            : <><FaSave />Save Pump Settings</>}
                    </button>
                </SettingSection>
            </div>

            {/* 5. DANGER ZONE */}
            <div className="settings-section">
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="card-header border-0 p-4 pb-3" style={{ backgroundColor: '#fff5f5' }}>
                        <div className="fw-bold text-danger" style={{ fontSize: '1rem' }}>⚠️ Danger Zone</div>
                        <div className="text-muted small">These actions are irreversible. Please be sure before proceeding.</div>
                    </div>
                    <div className="card-body p-4" style={{ backgroundColor: '#fff' }}>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <div className="p-4 rounded-3" style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}>
                                    <div className="fw-bold text-dark mb-1" style={{ fontSize: '0.9rem' }}>
                                        <FaTrash className="me-2" style={{ color: '#d97706' }} />
                                        Clear Sensor History
                                    </div>
                                    <div className="text-muted small mb-3">
                                        Permanently deletes all IoT sensor readings. Water usage chart and history page will reset.
                                    </div>
                                    {clearStep === 0 && (
                                        <button className="btn btn-sm fw-bold"
                                            style={{ backgroundColor: '#fff7ed', color: '#d97706', border: '1px solid #d97706', borderRadius: '8px' }}
                                            onClick={handleClearHistory}>
                                            Clear History
                                        </button>
                                    )}
                                    {clearStep === 1 && (
                                        <div>
                                            <div className="small fw-bold text-warning mb-2">Are you sure? This cannot be undone.</div>
                                            <div className="d-flex gap-2">
                                                <button className="btn btn-sm btn-warning fw-bold" onClick={handleClearHistory}>Yes, Clear It</button>
                                                <button className="btn btn-sm btn-light" onClick={() => setClearStep(0)}>Cancel</button>
                                            </div>
                                        </div>
                                    )}
                                    {clearStep === 2 && (
                                        <div className="d-flex align-items-center gap-2 text-muted small">
                                            <div className="spinner-border spinner-border-sm text-warning" /> Clearing...
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="p-4 rounded-3" style={{ backgroundColor: '#fff5f5', border: '1px solid #fecaca' }}>
                                    <div className="fw-bold text-dark mb-1" style={{ fontSize: '0.9rem' }}>
                                        <FaTrash className="me-2" style={{ color: '#dc2626' }} />
                                        Delete Account
                                    </div>
                                    <div className="text-muted small mb-3">
                                        Permanently deletes your account, all fields, sensor data, and settings.
                                    </div>
                                    {deleteStep === 0 && (
                                        <button className="btn btn-sm btn-outline-danger fw-bold"
                                            style={{ borderRadius: '8px' }}
                                            onClick={handleDeleteAccount}>
                                            Delete My Account
                                        </button>
                                    )}
                                    {deleteStep === 1 && (
                                        <div>
                                            <div className="small fw-bold text-danger mb-2">This will delete everything. Continue?</div>
                                            <div className="d-flex gap-2">
                                                <button className="btn btn-sm btn-danger fw-bold" onClick={handleDeleteAccount}>Yes, Delete Everything</button>
                                                <button className="btn btn-sm btn-light" onClick={() => setDeleteStep(0)}>Cancel</button>
                                            </div>
                                        </div>
                                    )}
                                    {deleteStep === 2 && (
                                        <div className="d-flex align-items-center gap-2 text-muted small">
                                            <div className="spinner-border spinner-border-sm text-danger" /> Deleting account...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Toast message={toast.message} type={toast.type} visible={toast.visible} />
        </div>
    );
};

export default SettingsPage;