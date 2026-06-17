import React from 'react';
import { WiHumidity, WiStrongWind, WiSunrise, WiSunset, WiBarometer, WiThermometer } from 'react-icons/wi';
import { FaMapMarkerAlt } from 'react-icons/fa';

// Map weather condition IDs to gradient backgrounds
const getWeatherGradient = (weatherId, isDay) => {
    if (weatherId >= 200 && weatherId < 300) return 'linear-gradient(135deg, #374151 0%, #4b5563 100%)'; // thunderstorm
    if (weatherId >= 300 && weatherId < 600) return 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 50%, #3b82f6 100%)'; // rain/drizzle
    if (weatherId >= 600 && weatherId < 700) return 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)'; // snow
    if (weatherId >= 700 && weatherId < 800) return 'linear-gradient(135deg, #78716c 0%, #a8a29e 100%)'; // atmosphere/fog
    if (weatherId === 800) return isDay
        ? 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 70%, #059669 100%)' // clear day — green
        : 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f4c3a 100%)'; // clear night
    if (weatherId > 800) return 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0891b2 100%)'; // cloudy
    return 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)';
};

const StatPill = ({ icon: Icon, label, value, iconSize = 28 }) => (
    <div style={{
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(8px)',
        borderRadius: '16px',
        padding: '14px 18px',
        border: '1px solid rgba(255,255,255,0.2)',
        minWidth: '110px',
        textAlign: 'center',
    }}>
        <Icon size={iconSize} style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '4px' }} />
        <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2 }}>{value}</div>
        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.72rem', marginTop: '2px' }}>{label}</div>
    </div>
);

const CurrentWeather = ({ data }) => {
    const formatTime = (ts) => new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const weatherId  = data.weather[0].id;
    const now        = Date.now() / 1000;
    const isDay      = now > data.sys.sunrise && now < data.sys.sunset;
    const gradient   = getWeatherGradient(weatherId, isDay);

    return (
        <div className="mb-4 rounded-4 overflow-hidden shadow-lg" style={{ background: gradient }}>
            <style>{`
                @keyframes floatIcon {
                    0%, 100% { transform: translateY(0px); }
                    50%       { transform: translateY(-8px); }
                }
                @keyframes shimmer {
                    0%   { opacity: 0.6; }
                    50%  { opacity: 1; }
                    100% { opacity: 0.6; }
                }
            `}</style>

            <div className="p-4 p-md-5">
                {/* Location row */}
                <div className="d-flex align-items-center gap-2 mb-4">
                    <FaMapMarkerAlt style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }} />
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', fontWeight: 600 }}>
                        {data.name}, {data.sys.country}
                    </span>
                    <span style={{
                        marginLeft: 'auto', background: 'rgba(255,255,255,0.2)',
                        borderRadius: '20px', padding: '2px 12px',
                        color: '#fff', fontSize: '0.72rem', fontWeight: 700,
                        animation: 'shimmer 2s ease-in-out infinite',
                    }}>
                        ● LIVE
                    </span>
                </div>

                <div className="row align-items-center g-4">
                    {/* Temperature + description */}
                    <div className="col-md-4 text-center text-md-start">
                        <div style={{ color: '#fff', fontSize: '5rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-2px' }}>
                            {Math.round(data.main.temp)}°
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', marginTop: '4px' }}>
                            Feels like {Math.round(data.main.feels_like)}°C
                        </div>
                        <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 600, marginTop: '8px', textTransform: 'capitalize' }}>
                            {data.weather[0].description}
                        </div>

                        {/* Sunrise / Sunset */}
                        <div className="d-flex gap-3 mt-4 justify-content-center justify-content-md-start">
                            <div style={{ textAlign: 'center' }}>
                                <WiSunrise size={32} style={{ color: '#fbbf24' }} />
                                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.68rem' }}>Sunrise</div>
                                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>{formatTime(data.sys.sunrise)}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <WiSunset size={32} style={{ color: '#f97316' }} />
                                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.68rem' }}>Sunset</div>
                                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>{formatTime(data.sys.sunset)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Animated weather icon */}
                    <div className="col-md-4 text-center">
                        <img
                            src={`https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`}
                            alt="weather"
                            style={{ width: '160px', height: '160px', animation: 'floatIcon 3s ease-in-out infinite', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))' }}
                        />
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', marginTop: '4px' }}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="col-md-4">
                        <div className="d-flex flex-wrap gap-2 justify-content-center justify-content-md-end">
                            <StatPill icon={WiHumidity}    label="Humidity"   value={`${data.main.humidity}%`} iconSize={32} />
                            <StatPill icon={WiStrongWind}  label="Wind"       value={`${data.wind.speed} km/h`} />
                            <StatPill icon={WiThermometer} label="High / Low" value={`${Math.round(data.main.temp_max)}° / ${Math.round(data.main.temp_min)}°`} />
                            <StatPill icon={WiBarometer}   label="Pressure"   value={`${data.main.pressure} hPa`} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CurrentWeather;