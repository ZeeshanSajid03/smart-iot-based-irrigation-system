import React, { useRef } from 'react';
import { WiHumidity, WiStrongWind } from 'react-icons/wi';

const weatherEmoji = (id) => {
    if (id >= 200 && id < 300) return '⛈️';
    if (id >= 300 && id < 400) return '🌦️';
    if (id >= 500 && id < 600) return '🌧️';
    if (id >= 600 && id < 700) return '❄️';
    if (id >= 700 && id < 800) return '🌫️';
    if (id === 800) return '☀️';
    if (id > 800) return '⛅';
    return '🌡️';
};

const HourlyForecast = ({ data }) => {
    const scrollRef = useRef(null);

    // Max temp for relative bar heights
    const maxTemp = Math.max(...data.map(d => d.main.temp));
    const minTemp = Math.min(...data.map(d => d.main.temp));

    return (
        <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-4 pb-3" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)' }}>
                <h5 className="fw-bold text-white mb-0">Hourly Forecast</h5>
                <div style={{ color: '#6ee7b7', fontSize: '0.75rem', marginTop: '2px' }}>
                    Next 30 hours
                </div>
            </div>

            <div className="card-body p-4" style={{ backgroundColor: '#f0fdf4' }}>
                {/* Scrollable hour cards */}
                <div
                    ref={scrollRef}
                    className="d-flex gap-3 pb-2"
                    style={{ overflowX: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#6ee7b7 #dcfce7' }}
                >
                    {data.map((hour, index) => {
                        const tempRange = maxTemp - minTemp || 1;
                        const barH      = ((hour.main.temp - minTemp) / tempRange) * 40 + 20;
                        const isNow     = index === 0;

                        return (
                            <div
                                key={index}
                                style={{
                                    minWidth: '110px',
                                    borderRadius: '16px',
                                    padding: '16px 12px',
                                    textAlign: 'center',
                                    background: isNow
                                        ? 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)'
                                        : '#fff',
                                    border: isNow ? 'none' : '1px solid #dcfce7',
                                    boxShadow: isNow
                                        ? '0 4px 16px rgba(6,78,59,0.3)'
                                        : '0 2px 8px rgba(0,0,0,0.05)',
                                    flexShrink: 0,
                                    transition: 'transform 0.2s',
                                    cursor: 'default',
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                {/* Time */}
                                <div style={{
                                    fontWeight: 700, fontSize: '0.78rem',
                                    color: isNow ? '#6ee7b7' : '#6b7280',
                                    marginBottom: '8px',
                                }}>
                                    {isNow ? 'Now' : new Date(hour.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>

                                {/* Weather icon (emoji + OWM icon) */}
                                <div style={{ fontSize: '1.6rem', marginBottom: '4px' }}>
                                    {weatherEmoji(hour.weather[0].id)}
                                </div>

                                {/* Temp bar */}
                                <div style={{
                                    width: '4px', height: `${barH}px`,
                                    borderRadius: '2px', margin: '8px auto',
                                    background: isNow
                                        ? 'linear-gradient(180deg, #6ee7b7, #34d399)'
                                        : 'linear-gradient(180deg, #10b981, #059669)',
                                }} />

                                {/* Temperature */}
                                <div style={{
                                    fontWeight: 800, fontSize: '1.2rem',
                                    color: isNow ? '#fff' : '#064e3b',
                                    marginBottom: '8px',
                                }}>
                                    {Math.round(hour.main.temp)}°
                                </div>

                                {/* Humidity */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px',
                                    color: isNow ? 'rgba(255,255,255,0.7)' : '#6b7280', fontSize: '0.7rem',
                                }}>
                                    <WiHumidity size={16} />
                                    {hour.main.humidity}%
                                </div>

                                {/* Wind */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px',
                                    color: isNow ? 'rgba(255,255,255,0.7)' : '#6b7280', fontSize: '0.7rem',
                                    marginTop: '2px',
                                }}>
                                    <WiStrongWind size={16} />
                                    {hour.wind.speed}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Agricultural advisory row */}
                <div className="mt-4 p-3 rounded-3 d-flex align-items-start gap-3"
                    style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac' }}>
                    <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>🌱</span>
                    <div>
                        <div className="fw-bold" style={{ color: '#064e3b', fontSize: '0.85rem' }}>
                            Agricultural Advisory
                        </div>
                        <div style={{ color: '#166534', fontSize: '0.78rem', marginTop: '2px' }}>
                            {data[0]?.main.humidity > 80
                                ? 'High humidity expected — monitor for fungal conditions. Consider reducing irrigation.'
                                : data[0]?.main.temp > 35
                                ? 'High temperatures forecast — increase irrigation frequency and check soil moisture often.'
                                : 'Conditions look favorable for irrigation. Monitor soil moisture and adjust as needed.'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HourlyForecast;