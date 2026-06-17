import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaEnvelopeOpenText, FaClock } from 'react-icons/fa';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get the email passed from the Signup page
    const email = location.state?.email || "";

    const [otp, setOtp] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    
    // 👇 TIMER STATE (2 Minutes = 120s)
    const [timeLeft, setTimeLeft] = useState(120); 

    // --- TIMER LOGIC ---
    useEffect(() => {
        // If no email, force them back to signup
        if (!email) {
            navigate('/signup');
            return;
        }

        // Countdown Logic
        if (timeLeft > 0) {
            const timerId = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timerId);
        }
    }, [timeLeft, email, navigate]);

    // Format Seconds to MM:SS
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setMessage(""); setError("");

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/verify-email`, { 
                email: email, 
                otp: otp 
            });

            if (res.data.status === "success") {
                setMessage("Email Verified Successfully! Redirecting...");
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError(res.data.message);
            }
        } catch (err) {
            setError("Server Error. Please try again.");
        }
    };

    // 👇 NEW: Handle Resend OTP
    const handleResend = async () => {
        setMessage(""); setError("");
        
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/resend-otp`, { email });
            
            if (res.data.status === "success") {
                setMessage("New code sent to your email!");
                setTimeLeft(120); // Reset timer to 2 minutes
            } else if (res.data.status === "expired") {
                setError("Session expired. Please sign up again.");
                setTimeout(() => {
                    navigate('/signup');
                }, 2000);
            } else {
                setError(res.data.message);
            }
        } catch (err) {
            setError("Server Error. Could not resend.");
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="card shadow-lg p-4 border-0 rounded-4 text-center" style={{ maxWidth: '400px', width: '100%' }}>
                
                <div className="mb-3 text-success">
                    <FaEnvelopeOpenText size={50} />
                </div>

                <h3 className="fw-bold mb-2" style={{ color: '#316150' }}>Verify your Email</h3>
                <p className="text-muted small mb-4">
                    We sent a code to <strong>{email}</strong>.<br/>
                    Please enter it below to activate your account.
                </p>

                {/* ALERTS */}
                {message && <div className="alert alert-success p-2 small fw-bold">{message}</div>}
                {error && <div className="alert alert-danger p-2 small fw-bold">{error}</div>}

                <form onSubmit={handleVerify}>
                    <div className="mb-3">
                        <input 
                            type="text" 
                            className="form-control text-center fw-bold fs-4" 
                            placeholder="0000" 
                            maxLength="4"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                            style={{ letterSpacing: '5px' }}
                        />
                    </div>

                    {/* 👇 TIMER DISPLAY */}
                    <div className={`mb-3 fw-bold small ${timeLeft < 30 ? 'text-danger' : 'text-success'}`}>
                        <FaClock className="me-1 mb-1" /> 
                        {timeLeft > 0 ? `Code expires in: ${formatTime(timeLeft)}` : "Code Expired"}
                    </div>

                    <button 
                        type="submit" 
                        className="btn w-100 btn-lg text-white fw-bold mb-3" 
                        style={{ backgroundColor: timeLeft > 0 ? '#3d7b65' : '#ccc' }}
                        disabled={timeLeft === 0} // Disable if time runs out
                    >
                        {timeLeft > 0 ? "Verify Account" : "Expired"}
                    </button>
                </form>

                <div className="text-muted small">
                    {timeLeft === 0 ? (
                        <>
                            Didn't receive it? <button onClick={handleResend} className="btn btn-link p-0 small text-decoration-none fw-bold">Resend Code</button>
                        </>
                    ) : (
                        <span className="text-muted">Please wait for the code...</span>
                    )}
                </div>

            </div>
        </div>
    );
};

export default VerifyEmail;