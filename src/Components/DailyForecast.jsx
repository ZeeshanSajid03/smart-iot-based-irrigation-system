import React from 'react';

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

const DailyForecast = ({ data }) => {
    const getDayName = (dateString) =>
        new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    const maxTemp = Math.max(...data.map(d => d.main.temp_max));
    const minTemp = Math.min(...data.map(d => d.main.temp_min));

    return (
        <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-4 pb-3" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)' }}>
                <h5 className="fw-bold text-white mb-0">5-Day Forecast</h5>
                <div style={{ color: '#6ee7b7', fontSize: '0.75rem', marginTop: '2px' }}>
                    Daily outlook for Rawalpindi
                </div>
            </div>

            <div className="card-body p-0" style={{ backgroundColor: '#f0fdf4' }}>
                {data.map((day, index) => {
                    const tempRange   = maxTemp - minTemp || 1;
                    const barWidth    = ((day.main.temp_max - minTemp) / tempRange) * 60 + 20;
                    const isToday     = index === 0;

                    return (
                        <div
                            key={index}
                            className="d-flex align-items-center px-4 py-3"
                            style={{
                                borderBottom: index < data.length - 1 ? '1px solid #dcfce7' : 'none',
                                backgroundColor: isToday ? '#dcfce7' : 'transparent',
                                transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={e => !isToday && (e.currentTarget.style.backgroundColor = '#f0fdf4')}
                            onMouseLeave={e => !isToday && (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                            {/* Weather icon */}
                            <div className="me-3" style={{ fontSize: '1.6rem', width: '36px', textAlign: 'center' }}>
                                {weatherEmoji(day.weather[0].id)}
                            </div>

                            {/* Day name */}
                            <div style={{ flex: 1 }}>
                                <div className="fw-bold" style={{ color: '#064e3b', fontSize: '0.85rem' }}>
                                    {isToday ? 'Today' : getDayName(day.dt_txt)}
                                </div>
                                <div style={{ color: '#6b7280', fontSize: '0.72rem', textTransform: 'capitalize' }}>
                                    {day.weather[0].description}
                                </div>
                            </div>

                            {/* Temp bar */}
                            <div className="d-flex align-items-center gap-2">
                                <span style={{ color: '#94a3b8', fontSize: '0.75rem', minWidth: '28px', textAlign: 'right' }}>
                                    {Math.round(day.main.temp_min)}°
                                </span>
                                <div style={{
                                    height: '6px', borderRadius: '3px',
                                    width: `${barWidth}px`,
                                    background: 'linear-gradient(90deg, #6ee7b7, #059669)',
                                    flexShrink: 0,
                                }} />
                                <span style={{ color: '#064e3b', fontSize: '0.85rem', fontWeight: 700, minWidth: '28px' }}>
                                    {Math.round(day.main.temp_max)}°
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DailyForecast;