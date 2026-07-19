import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import PumpControl from '../Components/PumpControl';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import {
    FaThermometerHalf, FaExclamationTriangle,
    FaCheckCircle, FaExclamationCircle, FaTint, FaWifi
} from 'react-icons/fa';

const ALERT_COOLDOWN_MS = 30 * 60 * 1000;
const THRESHOLDS = {
    SOIL_CRITICAL: 20, SOIL_WARNING: 35,
    TEMP_HIGH: 38, HUMIDITY_HIGH: 85, OFFLINE_MS: 120000,
};

const getLast7DayLabels = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({
            label:   d.toLocaleDateString('en-US', { weekday: 'short' }),
            dateStr: d.toISOString().split('T')[0]
        });
    }
    return days;
};

const buildWaterData = (pumpRuntimeHistory = [], todayRuntimeSeconds = 0, flowRateLPM = 15) => {
    const dayLabels  = getLast7DayLabels();
    const today      = new Date().toISOString().split('T')[0];
    const historyMap = {};
    (pumpRuntimeHistory || []).forEach(h => { historyMap[h.date] = h.seconds; });
    return dayLabels.map(d => {
        const isToday = d.dateStr === today;
        const seconds = isToday ? todayRuntimeSeconds : (historyMap[d.dateStr] || 0);
        const mins    = Math.round(seconds / 60);
        const litres  = Math.round(mins * flowRateLPM);
        return { day: d.label, litres, runtimeMinutes: mins, isToday };
    });
};

// soil2 removed — alerts now use only soil1
const evaluateAlerts = (reading) => {
    if (!reading) return [{ id: 'offline', type: 'critical', icon: 'wifi', title: 'No sensor data received', detail: 'Check hardware connection' }];
    const alerts = [];
    const soil   = reading.soil1;
    const ageMs  = Date.now() - new Date(reading.createdAt).getTime();
    if (ageMs > THRESHOLDS.OFFLINE_MS)          alerts.push({ id: 'offline',       type: 'critical', icon: 'wifi',        title: 'Sensor offline',                           detail: `No reading for ${Math.round(ageMs / 60000)} min` });
    if (soil < THRESHOLDS.SOIL_CRITICAL)         alerts.push({ id: 'soil_critical', type: 'critical', icon: 'exclamation', title: `Critical: Soil moisture at ${soil.toFixed(0)}%`, detail: `Below ${THRESHOLDS.SOIL_CRITICAL}% — wilting risk` });
    else if (soil < THRESHOLDS.SOIL_WARNING)     alerts.push({ id: 'soil_warning',  type: 'warning',  icon: 'exclamation', title: `Low soil moisture: ${soil.toFixed(0)}%`,    detail: `Below ${THRESHOLDS.SOIL_WARNING}% — irrigation recommended` });
    if (reading.temperature > THRESHOLDS.TEMP_HIGH)   alerts.push({ id: 'temp_high',    type: 'warning', icon: 'exclamation', title: `High temperature: ${reading.temperature}°C`, detail: `Above ${THRESHOLDS.TEMP_HIGH}°C — heat stress risk` });
    if (reading.humidity    > THRESHOLDS.HUMIDITY_HIGH) alerts.push({ id: 'humidity_high', type: 'warning', icon: 'exclamation', title: `High humidity: ${reading.humidity}%`,       detail: `Above ${THRESHOLDS.HUMIDITY_HIGH}% — fungal disease risk` });
    if (alerts.length === 0) alerts.push({ id: 'all_ok', type: 'ok', icon: 'check', title: 'All systems normal', detail: `Soil ${soil.toFixed(0)}% · Temp ${reading.temperature}°C · Humidity ${reading.humidity}%` });
    return alerts;
};

const SensorCard = ({ label, value, unit, bgColor, borderColor, textColor }) => {
    const [display, setDisplay] = useState(value);
    const [flash, setFlash]     = useState(false);
    const [hovered, setHovered] = useState(false);
    const prevRef               = useRef(value);

    useEffect(() => {
        if (value !== prevRef.current) {
            setFlash(true);
            setDisplay(value);
            prevRef.current = value;
            setTimeout(() => setFlash(false), 600);
        }
    }, [value]);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                padding: '16px', borderRadius: '16px', height: '100%',
                backgroundColor: bgColor,
                border: `1.5px solid ${hovered ? textColor : borderColor}`,
                transition: 'all 0.25s ease',
                transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
                boxShadow: hovered ? `0 8px 24px ${textColor}33` : flash ? `0 0 0 3px ${textColor}44` : '0 2px 8px rgba(0,0,0,0.04)',
                cursor: 'default', position: 'relative', overflow: 'hidden',
            }}
        >
            <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: `radial-gradient(circle at 60% 40%, ${textColor}08, transparent 60%)`, opacity: hovered ? 1 : 0, transition: 'opacity 0.3s', pointerEvents: 'none' }} />
            <div className="small text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
            <div style={{ fontWeight: 800, fontSize: '1.8rem', lineHeight: 1, color: textColor, transition: 'all 0.3s', transform: flash ? 'scale(1.08)' : 'scale(1)' }}>
                {display !== null && display !== undefined ? `${display}${unit}` : 'N/A'}
            </div>
            {flash && <div style={{ position: 'absolute', inset: 0, borderRadius: '16px', border: `2px solid ${textColor}`, animation: 'flashRing 0.6s ease forwards', pointerEvents: 'none' }} />}
        </div>
    );
};

const CustomTooltip = ({ active, payload, label, flowRate }) => {
    if (!active || !payload?.length) return null;
    const { litres, runtimeMinutes } = payload[0].payload;
    return (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 18px', boxShadow: '0 8px 28px rgba(0,0,0,0.12)', fontSize: '0.82rem', minWidth: '160px' }}>
            <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '8px', fontSize: '0.92rem' }}>{label}</div>
            <div style={{ color: '#0284c7', marginBottom: '4px' }}>💧 <strong>{litres} L</strong> used</div>
            <div style={{ color: '#64748b' }}>⏱ Pump ran ~{runtimeMinutes} min</div>
            <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginTop: '6px', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>Based on {flowRate} L/min flow rate</div>
        </div>
    );
};

const IrrigationAnimation = () => (
    <div style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)', borderRadius: '16px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 6px 28px rgba(16,185,129,0.3)', border: '1px solid rgba(110,231,183,0.3)', animation: 'bannerSlide 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0 }}>
            <div style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', width: '32px', height: '10px', borderRadius: '50%', background: 'rgba(110,231,183,0.25)', animation: 'ripple 1.2s ease-out infinite' }} />
            {[{ left: '10px', delay: '0s' }, { left: '24px', delay: '0.4s' }, { left: '38px', delay: '0.8s' }].map((d, i) => (
                <div key={i} style={{ position: 'absolute', top: 0, left: d.left, width: '8px', height: '12px', background: i === 1 ? '#34d399' : '#6ee7b7', borderRadius: '50% 50% 50% 50% / 30% 30% 70% 70%', animation: 'dropFall 1.2s ease-in infinite', animationDelay: d.delay }} />
            ))}
        </div>
        <div style={{ flex: 1 }}>
            <div style={{ color: '#ecfdf5', fontWeight: 700, fontSize: '0.95rem', marginBottom: '2px', animation: 'irrigPulse 2s ease-in-out infinite' }}>💧 Irrigation Active</div>
            <div style={{ color: '#6ee7b7', fontSize: '0.75rem' }}>Pump is running — water is being delivered to your fields</div>
        </div>
        <div style={{ background: 'rgba(110,231,183,0.2)', border: '1px solid #6ee7b7', borderRadius: '20px', padding: '4px 12px', color: '#6ee7b7', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', animation: 'irrigPulse 1s ease-in-out infinite', display: 'inline-block' }} />
            LIVE
        </div>
    </div>
);

const DashboardPage = () => {
    const [latestReading, setLatestReading] = useState(null);
    const [loadingSensor, setLoadingSensor] = useState(true);
    const [waterData, setWaterData]         = useState([]);
    const [pumpOn, setPumpOn]               = useState(false);
    const [systemAlerts, setSystemAlerts]   = useState([]);
    const [flowRate, setFlowRate]           = useState(15);
    const [pageVisible, setPageVisible]     = useState(false);

    const userEmailRef = useRef('');

    useEffect(() => { setTimeout(() => setPageVisible(true), 50); }, []);

    const maybeSendNotification = async (alert, email) => {
        const key      = `alert_sent_${alert.id}`;
        const lastSent = parseInt(localStorage.getItem(key) || '0', 10);
        if (Date.now() - lastSent < ALERT_COOLDOWN_MS) return;
        localStorage.setItem(key, String(Date.now()));
        const headerMap = { offline: '⚠️ Sensor Offline', soil_critical: '🚨 Critical: Soil Moisture', soil_warning: '⚠️ Low Soil Moisture', temp_high: '🌡️ High Temperature Alert', humidity_high: '💧 High Humidity Alert' };
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/notifications/send`, {
                target: email, header: headerMap[alert.id] || 'System Alert', message: `${alert.title}. ${alert.detail}`, image: null,
            });
        } catch (err) { /* silent */ }
    };

    useEffect(() => {
        const stored    = localStorage.getItem('user');
        const userEmail = stored ? JSON.parse(stored).email : null;
        if (!userEmail) { setLoadingSensor(false); return; }
        userEmailRef.current = userEmail;

        const fetchSensorData = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/sensor-data/${userEmail}`);
                if (res.data.status === 'success' && res.data.data.length > 0) {
                    const latest = res.data.data[0];
                    setLatestReading(latest);
                    const alerts = evaluateAlerts(latest);
                    setSystemAlerts(alerts);
                    alerts.forEach(a => { if (a.type !== 'ok') maybeSendNotification(a, userEmail); });
                } else {
                    setSystemAlerts(evaluateAlerts(null));
                }
            } catch (err) { console.error('Error fetching sensor data:', err); }
            finally { setLoadingSensor(false); }
        };

        const fetchPumpState = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/pump/status/${userEmail}`);
                if (res.data.status === 'success') {
                    setPumpOn(res.data.pumpStatus);
                    const runtime  = res.data.pumpRuntimeTodaySeconds || 0;
                    const fr       = res.data.pumpFlowRate || 15;
                    const history  = res.data.pumpRuntimeHistory || [];
                    setFlowRate(fr);
                    setWaterData(buildWaterData(history, runtime, fr));
                }
            } catch (err) { /* silent */ }
        };

        fetchSensorData();
        fetchPumpState();
        const dataInterval = setInterval(fetchSensorData, 5000);
        const pumpInterval = setInterval(fetchPumpState, 5000);
        return () => { clearInterval(dataInterval); clearInterval(pumpInterval); };
    }, []);

    const totalLitres = waterData.reduce((sum, d) => sum + d.litres, 0);
    const avgLitres   = waterData.length ? Math.round(totalLitres / waterData.length) : 0;
    const maxDay      = waterData.length ? waterData.reduce((best, d) => d.litres > best.litres ? d : best, waterData[0]) : { day: '—' };

    const renderAlert = (alert) => {
        const styles = {
            critical: { bg: '#fecaca', iconColor: '#dc2626', Icon: FaExclamationCircle, border: '#fca5a5' },
            warning:  { bg: '#fef3c7', iconColor: '#d97706', Icon: FaExclamationTriangle, border: '#fcd34d' },
            ok:       { bg: '#dcfce7', iconColor: '#059669', Icon: FaCheckCircle, border: '#86efac' },
        };
        const s        = styles[alert.type] || styles.ok;
        const IconComp = alert.icon === 'wifi' ? FaWifi : s.Icon;
        return (
            <div key={alert.id}
                style={{ display: 'flex', gap: '12px', padding: '12px 14px', borderRadius: '12px', backgroundColor: s.bg, border: `1px solid ${s.border}`, transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default', animation: 'alertSlide 0.3s ease' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(3px)'; e.currentTarget.style.boxShadow = `0 4px 12px ${s.iconColor}22`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
                <IconComp style={{ color: s.iconColor, marginTop: '2px', flexShrink: 0 }} />
                <div>
                    <div className="fw-bold text-secondary" style={{ fontSize: '0.88rem' }}>{alert.title}</div>
                    <div className="small text-muted">{alert.detail}</div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ opacity: pageVisible ? 1 : 0, transform: pageVisible ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity 0.5s ease, transform 0.5s ease' }}>
            <style>{`
                @keyframes dropFall { 0% { transform: translateY(-8px); opacity: 0; } 20% { opacity: 1; } 100% { transform: translateY(28px); opacity: 0; } }
                @keyframes ripple   { 0% { transform: scale(0.8); opacity: 0.8; } 100% { transform: scale(2.2); opacity: 0; } }
                @keyframes irrigPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
                @keyframes flashRing  { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(1.06); } }
                @keyframes bannerSlide { from { opacity: 0; transform: translateY(-10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes alertSlide  { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes cardEntrance { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .dash-section { animation: cardEntrance 0.45s ease both; }
                .dash-section:nth-child(1) { animation-delay: 0.05s; }
                .dash-section:nth-child(2) { animation-delay: 0.12s; }
                .dash-section:nth-child(3) { animation-delay: 0.19s; }
                .dash-section:nth-child(4) { animation-delay: 0.26s; }
            `}</style>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-0" style={{ color: '#064e3b' }}>Dashboard</h2>
                    <p className="text-muted small mb-0">Live monitoring — auto-refreshes every 5 seconds</p>
                </div>
                {latestReading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#dcfce7', border: '1px solid #86efac', borderRadius: '20px', padding: '6px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', animation: 'irrigPulse 1.5s ease-in-out infinite' }} />
                        Sensors Online
                    </div>
                )}
            </div>

            {pumpOn && <div className="dash-section"><IrrigationAnimation /></div>}

            {/* ── 1. LIVE SENSOR READINGS — 3 cards now (soil2 removed) ────── */}
            <div className="dash-section mb-4">
                <div style={{ borderRadius: '20px', overflow: 'hidden', background: 'linear-gradient(135deg, #e2efeb 0%, #d1fae5 100%)', border: '1px solid #a7f3d0', boxShadow: '0 2px 16px rgba(16,185,129,0.08)' }}>
                    <div style={{ padding: '14px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#065f46', fontSize: '0.92rem' }}>
                            <FaThermometerHalf style={{ color: '#10b981' }} /> Live Sensor Readings
                        </div>
                        {latestReading && <span style={{ backgroundColor: '#10b981', color: '#fff', borderRadius: '20px', padding: '3px 10px', fontSize: '0.68rem', fontWeight: 700 }}>● LIVE</span>}
                    </div>
                    <div style={{ padding: '8px 16px 16px' }}>
                        <div className="row g-3">
                            <div className="col-6 col-md-4">
                                <SensorCard label="Temperature" value={loadingSensor ? null : latestReading?.temperature ?? null} unit="°C" bgColor="#fef3c7" borderColor="#fcd34d" textColor="#d97706" />
                            </div>
                            <div className="col-6 col-md-4">
                                <SensorCard label="Soil Moisture" value={loadingSensor ? null : latestReading?.soil1 ?? null} unit="%" bgColor="#a7f3d0" borderColor="#6ee7b7" textColor="#059669" />
                            </div>
                            <div className="col-6 col-md-4">
                                <SensorCard label="Humidity" value={loadingSensor ? null : latestReading?.humidity ?? null} unit="%" bgColor="#bae6fd" borderColor="#7dd3fc" textColor="#0284c7" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 2. PUMP & ALERTS ─────────────────────────────────────────── */}
            <div className="row g-4 mb-4 dash-section">
                <div className="col-lg-6"><PumpControl /></div>
                <div className="col-lg-6">
                    <div style={{ borderRadius: '20px', height: '100%', backgroundColor: '#b1c2bc', border: '1px solid #9db4ae', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                        <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>
                            <FaExclamationTriangle style={{ color: '#d97706' }} /> System Alerts
                            {systemAlerts.filter(a => a.type !== 'ok').length > 0 && (
                                <span style={{ marginLeft: 'auto', backgroundColor: '#dc2626', color: '#fff', borderRadius: '20px', padding: '2px 10px', fontSize: '0.68rem', fontWeight: 700 }}>
                                    {systemAlerts.filter(a => a.type !== 'ok').length} Active
                                </span>
                            )}
                        </div>
                        <div style={{ padding: '4px 12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {loadingSensor ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '0.82rem' }}>
                                    <div className="spinner-border spinner-border-sm text-success me-2" /> Evaluating sensor data...
                                </div>
                            ) : systemAlerts.map(renderAlert)}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 3. WATER USAGE CHART ─────────────────────────────────────── */}
            <div className="dash-section">
                <div style={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                    <div style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <FaTint style={{ color: '#6ee7b7', fontSize: '0.9rem' }} />
                                <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>Estimated Water Usage</span>
                            </div>
                            <div style={{ color: '#6ee7b7', fontSize: '0.75rem', opacity: 0.85 }}>Calculated from pump runtime × {flowRate} L/min — Last 7 days</div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }} className="d-none d-md-flex">
                            {[{ label: '7-Day Total', value: `${totalLitres} L`, color: '#38bdf8' }, { label: 'Daily Avg', value: `${avgLitres} L`, color: '#6ee7b7' }, { label: 'Peak Day', value: maxDay.day, color: '#fbbf24' }].map((stat, i) => (
                                <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 14px', textAlign: 'center', minWidth: '80px', border: '1px solid rgba(255,255,255,0.15)', transition: 'background 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.18)'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                                >
                                    <div style={{ color: stat.color, fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{stat.label}</div>
                                    <div style={{ color: '#fff', fontWeight: 800, fontSize: '1rem' }}>{stat.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ backgroundColor: '#e2efeb', padding: '20px 16px 16px' }}>
                        {totalLitres === 0 ? (
                            <div style={{ height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                <FaTint style={{ fontSize: '2.5rem', color: '#a7f3d0', marginBottom: '12px' }} />
                                <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>No pump activity recorded yet.</div>
                                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '4px' }}>Turn the pump on to start tracking water usage.</div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={waterData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barCategoryGap="35%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#a7f3d0" vertical={false} />
                                    <XAxis dataKey="day" tick={{ fill: '#374151', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}L`} width={48} />
                                    <Tooltip content={<CustomTooltip flowRate={flowRate} />} cursor={{ fill: 'rgba(16,185,129,0.08)', radius: 8 }} />
                                    {avgLitres > 0 && <ReferenceLine y={avgLitres} stroke="#d97706" strokeDasharray="5 4" strokeWidth={1.5} label={{ value: `Avg ${avgLitres}L`, position: 'insideTopRight', fill: '#d97706', fontSize: 11, fontWeight: 600 }} />}
                                    <Bar dataKey="litres" radius={[8, 8, 0, 0]} maxBarSize={52}>
                                        {waterData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.isToday ? '#059669' : '#10b981'} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px', marginTop: '12px', fontSize: '0.72rem', color: '#4b5563' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#059669' }} />Today</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#10b981' }} />Past days</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ display: 'inline-block', width: '22px', height: '0px', borderTop: '2px dashed #d97706' }} />Daily average</span>
                            <span style={{ marginLeft: 'auto', color: '#6b7280', fontStyle: 'italic' }}>Estimation based on {flowRate} L/min pump flow rate</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;