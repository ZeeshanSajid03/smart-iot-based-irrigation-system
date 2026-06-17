import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaPowerOff, FaBrain, FaClock } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';

const formatRuntime = (totalSeconds) => {
    if (!totalSeconds || totalSeconds <= 0) return '0m';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
};

const PumpControl = () => {
    const [pumpOn, setPumpOn]       = useState(false);
    const [smartMode, setSmartMode] = useState(false);
    const [loading, setLoading]     = useState(true);
    const [toggling, setToggling]   = useState(false);

    // Accumulated seconds from completed sessions today (persisted in DB)
    const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);
    // Live seconds for the current active session
    const [liveSeconds, setLiveSeconds] = useState(0);

    const tickerRef    = useRef(null);
    const userEmailRef = useRef('');

    const startTicker = (alreadyElapsed = 0) => {
        stopTicker();
        setLiveSeconds(alreadyElapsed);
        tickerRef.current = setInterval(() => {
            setLiveSeconds(s => s + 1);
        }, 1000);
    };

    const stopTicker = () => {
        if (tickerRef.current) {
            clearInterval(tickerRef.current);
            tickerRef.current = null;
        }
        setLiveSeconds(0);
    };

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) { setLoading(false); return; }
        const email = JSON.parse(stored).email;
        userEmailRef.current = email;

        fetchPumpState(email);
        const interval = setInterval(() => fetchPumpState(email), 5000);
        return () => { clearInterval(interval); stopTicker(); };
    }, []);

    const fetchPumpState = async (email) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/pump/status/${email}`);
            if (res.data.status !== 'success') return;

            const {
                pumpStatus, smartMode: sm,
                irrigationStartedAt,
                pumpRuntimeTodaySeconds
            } = res.data;

            setPumpOn(pumpStatus);
            setSmartMode(sm);

            // accumulated = completed sessions today from DB
            setAccumulatedSeconds(pumpRuntimeTodaySeconds || 0);

            if (pumpStatus && irrigationStartedAt) {
                // Current session elapsed time
                const elapsed = Math.floor(
                    (Date.now() - new Date(irrigationStartedAt).getTime()) / 1000
                );
                if (!tickerRef.current) {
                    startTicker(Math.max(0, elapsed));
                }
            } else if (!pumpStatus) {
                stopTicker();
            }
        } catch (err) {
            console.error('Error fetching pump state:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleManualToggle = async () => {
        if (smartMode || toggling) return;
        const email = userEmailRef.current;
        if (!email) return;

        setToggling(true);
        const newState = !pumpOn;
        setPumpOn(newState);

        if (newState) {
            startTicker(0);
        } else {
            // Add live session to accumulator immediately on UI
            setAccumulatedSeconds(prev => prev + liveSeconds);
            stopTicker();
        }

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/pump/control`, {
                email, action: 'manual', state: newState,
            });
            if (res.data.status === 'success') {
                // Sync accumulated value from server (authoritative)
                setAccumulatedSeconds(res.data.pumpRuntimeTodaySeconds || 0);
            }
        } catch (err) {
            console.error('Error toggling pump:', err);
            setPumpOn(!newState);
            stopTicker();
        } finally {
            setToggling(false);
        }
    };

    const handleSmartToggle = async () => {
        if (toggling) return;
        const email = userEmailRef.current;
        if (!email) return;

        setToggling(true);
        const newState = !smartMode;
        setSmartMode(newState);

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/pump/control`, {
                email, action: 'smart', state: newState,
            });
            if (!newState) {
                const res = await axios.post('${import.meta.env.VITE_API_URL}/api/pump/control', {
                    email, action: 'manual', state: false,
                });
                setPumpOn(false);
                setAccumulatedSeconds(res.data.pumpRuntimeTodaySeconds || 0);
                stopTicker();
            }
        } catch (err) {
            console.error('Error toggling smart mode:', err);
            setSmartMode(!newState);
        } finally {
            setToggling(false);
        }
    };

    // Total runtime = completed sessions + current live session
    const totalRuntimeDisplay = formatRuntime(accumulatedSeconds + liveSeconds);

    if (loading) {
        return (
            <div className="card border-0 shadow-sm rounded-4 h-100 d-flex align-items-center justify-content-center"
                style={{ backgroundColor: '#b1c2bc', minHeight: '200px' }}>
                <div className="spinner-border spinner-border-sm text-success" />
            </div>
        );
    }

    return (
        <div className="card border-0 shadow-sm rounded-4 h-100" style={{ backgroundColor: '#b1c2bc' }}>
            <div className="card-header border-0 bg-transparent text-secondary fw-bold d-flex align-items-center gap-2 p-3">
                <FaPowerOff /> Pump Control
            </div>

            <div className="card-body p-3 pt-0 d-flex flex-column gap-2">

                {/* MANUAL PUMP TOGGLE */}
                <div className="d-flex align-items-center justify-content-between p-3 rounded-4"
                    style={{ backgroundColor: '#cbe1d4', opacity: smartMode ? 0.55 : 1, transition: 'opacity 0.2s' }}>
                    <div className="d-flex align-items-center gap-3">
                        <div className="rounded-circle d-flex align-items-center justify-content-center text-white"
                            style={{ width: '40px', height: '40px', backgroundColor: pumpOn ? '#10b981' : '#6b7280', transition: 'background-color 0.3s' }}>
                            <FaPowerOff />
                        </div>
                        <div>
                            <div className="fw-bold text-secondary mb-0" style={{ lineHeight: '1.2' }}>Pump Status</div>
                            <div className="small text-muted">
                                {smartMode ? 'Controlled by AI' : pumpOn ? 'Running' : 'Stopped'}
                            </div>
                        </div>
                    </div>
                    <div className="form-check form-switch m-0">
                        <input className="form-check-input" type="checkbox"
                            style={{ transform: 'scale(1.3)', cursor: smartMode ? 'not-allowed' : 'pointer' }}
                            checked={pumpOn} onChange={handleManualToggle}
                            disabled={smartMode || toggling}
                            title={smartMode ? 'Disable Smart Mode to control manually' : ''}
                        />
                    </div>
                </div>

                {/* RUNTIME TODAY — accumulated + live */}
                <div className="d-flex justify-content-between align-items-center px-3 py-2 rounded-3 text-secondary small fw-bold"
                    style={{ backgroundColor: '#9db4ae' }}>
                    <span className="d-flex align-items-center gap-2">
                        <FaClock size={12} /> Runtime Today
                    </span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {totalRuntimeDisplay}
                    </span>
                </div>

                {/* SMART MODE TOGGLE */}
                <div className="d-flex align-items-center justify-content-between p-3 rounded-4"
                    style={{ backgroundColor: smartMode ? '#bbf7d0' : '#cbe1d4', transition: 'background-color 0.3s' }}>
                    <div className="d-flex align-items-center gap-3">
                        <div className="rounded-circle d-flex align-items-center justify-content-center text-white"
                            style={{ width: '40px', height: '40px', backgroundColor: smartMode ? '#10b981' : '#6b7280', transition: 'background-color 0.3s' }}>
                            <FaBrain />
                        </div>
                        <div>
                            <div className="fw-bold text-secondary mb-0" style={{ lineHeight: '1.2' }}>Smart Pump Status</div>
                            <div className="small" style={{ color: smartMode ? '#059669' : '#6b7280' }}>
                                {smartMode ? 'AI is controlling the pump' : 'Manual mode active'}
                            </div>
                        </div>
                    </div>
                    <div className="form-check form-switch m-0">
                        <input className="form-check-input" type="checkbox"
                            style={{ transform: 'scale(1.3)', cursor: toggling ? 'wait' : 'pointer',
                                backgroundColor: smartMode ? '#10b981' : '', borderColor: smartMode ? '#10b981' : '' }}
                            checked={smartMode} onChange={handleSmartToggle} disabled={toggling}
                        />
                    </div>
                </div>

                {/* AI STATUS */}
                {smartMode && (
                    <div className="px-3 py-2 rounded-3 d-flex align-items-center gap-2"
                        style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac' }}>
                        <span style={{
                            display: 'inline-block', width: '8px', height: '8px',
                            borderRadius: '50%', backgroundColor: '#10b981',
                            animation: 'pulse 1.5s infinite', flexShrink: 0,
                        }} />
                        <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>
                            AI model running — prediction every 30s
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PumpControl;