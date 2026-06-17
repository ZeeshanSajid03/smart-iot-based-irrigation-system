import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaEnvelope, FaLock, FaKey, FaArrowLeft, FaEye, FaEyeSlash, FaClock } from 'react-icons/fa';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preFilledEmail = location.state?.email || ""; 

  // --- STATE ---
  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState(preFilledEmail); 
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false); 
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // 👇 TIMER STATE (90 Seconds = 1:30)
  const [timeLeft, setTimeLeft] = useState(90); 

  // --- TIMER LOGIC ---
  useEffect(() => {
    // Only run timer if we are on Step 2 (OTP) and time > 0
    if (step === 2 && timeLeft > 0) {
      const timerId = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timerId); // Cleanup
    }
  }, [step, timeLeft]);

  // Helper to format seconds into MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // --- HANDLERS ---

  const handleSendCode = async (e) => {
    e && e.preventDefault(); // Handle both button click and form submit
    setMessage(''); setError('');
    
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/forgot-password`, { email });
      if (res.data.status === "success") {
        setStep(2); 
        setTimeLeft(90); // 👈 RESET TIMER TO 90 SECONDS
        setMessage("Code sent to your email!");
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Server Error. Could not send email.");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/verify-otp`, { email, otp });
      if (res.data.status === "success") {
        setStep(3); 
        setMessage("Code Verified! Please set a new password.");
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Server Error.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');

    if (newPassword !== confirmPassword) {
        setError("Passwords do not match!");
        return;
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/reset-password`, { email, newPassword });
      if (res.data.status === "success") {
        alert("Password Changed Successfully! Login with your new password.");
        navigate('/login');
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Server Error.");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="card shadow-lg p-4 border-0 rounded-4" style={{ maxWidth: '450px', width: '100%' }}>
        
        <button onClick={() => navigate('/login')} className="btn btn-link text-decoration-none text-secondary mb-3 p-0">
            <FaArrowLeft /> Back to Login
        </button>

        <h3 className="text-center fw-bold mb-4" style={{ color: '#316150' }}>
            {step === 1 && "Forgot Password"}
            {step === 2 && "Enter Code"}
            {step === 3 && "Reset Password"}
        </h3>

        {message && <div className="alert alert-success p-2 small text-center">{message}</div>}
        {error && <div className="alert alert-danger p-2 small text-center">{error}</div>}

        {/* STEP 1: EMAIL */}
        {step === 1 && (
            <form onSubmit={handleSendCode}>
                <div className="mb-3">
                    <label className="form-label text-muted small fw-bold">Enter your registered email</label>
                    <div className="input-group">
                        <span className="input-group-text bg-white"><FaEnvelope className="text-muted"/></span>
                        <input 
                            type="email" className="form-control" placeholder="example123@gmail.com" required
                            value={email} onChange={(e) => setEmail(e.target.value)}
                            readOnly={!!preFilledEmail} 
                            style={{ backgroundColor: preFilledEmail ? '#e9ecef' : 'white', cursor: preFilledEmail ? 'not-allowed' : 'text' }}
                        />
                    </div>
                </div>
                <button type="submit" className="btn text-white w-100 fw-bold" style={{ backgroundColor: '#3d7b65' }}>Send Code</button>
            </form>
        )}

        {/* STEP 2: OTP WITH TIMER */}
        {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
                <div className="mb-3">
                    <label className="form-label text-muted small fw-bold">Enter 4-digit Code</label>
                    <div className="input-group">
                        <span className="input-group-text bg-white"><FaKey className="text-muted"/></span>
                        <input 
                            type="text" className="form-control" placeholder="1234" maxLength="4" required
                            value={otp} onChange={(e) => setOtp(e.target.value)}
                        />
                    </div>
                    
                    {/* 👇 TIMER DISPLAY */}
                    <div className="d-flex justify-content-between align-items-center mt-2">
                        <span className={`small fw-bold ${timeLeft < 10 ? 'text-danger' : 'text-muted'}`}>
                            <FaClock className="me-1" /> {formatTime(timeLeft)}
                        </span>

                        {/* Disable Resend until time is 0 */}
                        <button 
                            type="button" 
                            onClick={() => handleSendCode(null)} 
                            disabled={timeLeft > 0}
                            className={`btn btn-link text-decoration-none p-0 small ${timeLeft > 0 ? 'text-muted' : 'text-primary'}`}
                        >
                            Resend Code?
                        </button>
                    </div>
                </div>
                <button type="submit" className="btn text-white w-100 fw-bold" style={{ backgroundColor: '#3d7b65' }}>Verify Code</button>
            </form>
        )}

        {/* STEP 3: NEW PASSWORD */}
        {step === 3 && (
            <form onSubmit={handleResetPassword}>
                <div className="mb-3">
                    <label className="form-label text-muted small fw-bold">New Password</label>
                    <div className="input-group">
                        <span className="input-group-text bg-white"><FaLock className="text-muted"/></span>
                        <input 
                            type={showPassword ? "text" : "password"} className="form-control" placeholder="New Password" required
                            value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <button type="button" className="btn btn-outline-secondary border-start-0" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <FaEyeSlash/> : <FaEye/>}
                        </button>
                    </div>
                </div>
                <div className="mb-3">
                    <label className="form-label text-muted small fw-bold">Confirm Password</label>
                    <div className="input-group">
                        <span className="input-group-text bg-white"><FaLock className="text-muted"/></span>
                        <input 
                            type={showConfirmPassword ? "text" : "password"} className="form-control" placeholder="Confirm Password" required
                            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button type="button" className="btn btn-outline-secondary border-start-0" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ? <FaEyeSlash/> : <FaEye/>}
                        </button>
                    </div>
                </div>
                <button type="submit" className="btn text-white w-100 fw-bold" style={{ backgroundColor: '#3d7b65' }}>Reset Password</button>
            </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;