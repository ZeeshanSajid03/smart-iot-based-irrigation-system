import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import axios from 'axios'; 
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const logoImg = "/Logo.png"; 

const SignupForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '', 
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); 
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); 
    
    // --- VALIDATION CHECKS ---

    // 1. NAME CHECK (Alphabets Only)
    const nameRegex = /^[A-Za-z]+$/;
    if (!nameRegex.test(formData.firstName) || !nameRegex.test(formData.lastName)) {
        setError("First and Last Name must contain alphabet characters only.");
        return;
    }

    // 2. PAKISTANI PHONE NUMBER CHECK (Strict)
    const pakPhoneRegex = /^(\+92|0)3\d{2}[- ]?\d{7}$/;
    if (!pakPhoneRegex.test(formData.phone)) {
        setError("Invalid Pakistani Number! Must start with '03' or '+923'. Format: 0300-1234567 or 0300 1234567.");
        return;
    }
    if (formData.phone.length < 10 || formData.phone.length > 14) {
        setError("Phone number length is invalid.");
        return;
    }

    // 3. DETAILED EMAIL VALIDATION (STRICT GMAIL ONLY)
    const emailParts = formData.email.split('@');
    if (emailParts.length !== 2 || !emailParts[0] || !emailParts[1]) {
        setError("Invalid Email Format! Missing '@' or incomplete address.");
        return;
    }

    const [localPart, domainPart] = emailParts;
    const domainLower = domainPart.toLowerCase();

    // 👇 REQ: ONLY GMAIL ALLOWED
    if (domainLower !== 'gmail.com') {
        setError("Only Gmail accounts (@gmail.com) are allowed.");
        return;
    }

    const validUsernameRegex = /^[a-zA-Z0-9._-]+$/;
    if (!validUsernameRegex.test(localPart)) {
        setError("Email username contains invalid characters.");
        return;
    }

    // 4. USERNAME CHECK (Updated: Start with Letter + Number/Symbol)
    
    // Check A: Must start with a Letter
    if (!/^[a-zA-Z]/.test(formData.username)) {
        setError("Username must start with an alphabet letter (A-Z).");
        return;
    }

    // Check B: Must contain at least one Number OR Symbol
    const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.username);
    if (!hasNumberOrSymbol) {
        setError("Username must contain at least one Number or Symbol (e.g. Ali123).");
        return;
    }

    // 5. PASSWORD STRENGTH & MATCH
    const passwordStrongRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
    if (!passwordStrongRegex.test(formData.password)) {
        setError("Password must be 8+ chars, with 1 Capital Letter and 1 Symbol.");
        return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    // --- SEND DATA TO BACKEND ---
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/signup`, formData);

      if (response.data.status === "pending") { 
        setSuccess("Account Created! Please check your email for the verification code.");
        
        setTimeout(() => {
            navigate('/verify-email', { state: { email: formData.email } }); 
        }, 1500);

      } else if (response.data.status === "error") {
        setError(response.data.message);
      }

    } catch (err) {
      console.error(err);
      setError("Server error.");
    }
  };

  return (
    <div className="form-container w-100 px-4 py-5 my-auto" style={{ maxWidth: '550px' }}>
      
      <div className="text-center mb-4">
        <img src={logoImg} alt="Logo" className="mb-3" style={{ width: '100px', height: 'auto' }} />
        <h2 className="fw-bold text-secondary">Register Now</h2>
      </div>

      {/* --- ALERTS --- */}
      {error && <div className="alert alert-danger p-2 small text-center fw-bold">{error}</div>}
      {success && <div className="alert alert-success p-2 small text-center fw-bold">{success}</div>}

      <form onSubmit={handleSubmit}>
        
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label text-muted fw-bold small">First name</label>
            <input 
              type="text" name="firstName" className="form-control bg-light" 
              placeholder="Ali" value={formData.firstName} onChange={handleChange} required
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label text-muted fw-bold small">Last name</label>
            <input 
              type="text" name="lastName" className="form-control bg-light" 
              placeholder="Ahmed" value={formData.lastName} onChange={handleChange} required
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label text-muted fw-bold small">User Name</label>
          <input 
            type="text" name="username" className="form-control bg-light" 
            placeholder="Ali123 or Ali_Ahmed" value={formData.username} onChange={handleChange} required
          />
          <div className="form-text small" style={{fontSize: '0.75rem'}}>Must start with a letter.</div>
        </div>

        <div className="mb-3">
          <label className="form-label text-muted fw-bold small">Phone Number</label>
          <input 
            type="text" name="phone" className="form-control bg-light" 
            placeholder="0300 1234567" value={formData.phone} onChange={handleChange} required
          />
        </div>

        <div className="mb-3">
          <label className="form-label text-muted fw-bold small">Email address</label>
          <input 
            type="email" name="email" className="form-control bg-light" 
            placeholder="ali@gmail.com" value={formData.email} onChange={handleChange} required
          />
           <div className="form-text small" style={{fontSize: '0.75rem'}}>Only Gmail is allowed.</div>
        </div>

        <div className="mb-3">
          <label className="form-label text-muted fw-bold small">Password</label>
          <div className="input-group">
            <input 
              type={showPassword ? "text" : "password"} name="password"
              className="form-control bg-light border-end-0" placeholder="••••••" 
              value={formData.password} onChange={handleChange} required
            />
            <span 
              className="input-group-text bg-light border-start-0" style={{ cursor: 'pointer' }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEye /> : <FaEyeSlash />}
            </span>
          </div>
          <div className="form-text small" style={{fontSize: '0.75rem'}}>
             Must be 8+ chars, with 1 Capital letter & 1 Symbol.
          </div>
        </div>

        <div className="mb-4">
          <label className="form-label text-muted fw-bold small">Confirm Password</label>
          <div className="input-group">
            <input 
              type={showConfirmPassword ? "text" : "password"} name="confirmPassword"
              className="form-control bg-light border-end-0" placeholder="••••••" 
              value={formData.confirmPassword} onChange={handleChange} required
            />
            <span 
              className="input-group-text bg-light border-start-0" style={{ cursor: 'pointer' }}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
            </span>
          </div>
        </div>

        {/* 👇 REMOVED "REMEMBER ME" CHECKBOX HERE */}

        <button type="submit" className="btn w-100 btn-lg mb-4 custom-green-btn text-white">
          Signup
        </button>
      </form>

      <div className="text-center mt-3"> 
        <p className="text-muted small">
          Have an account? <Link to="/login" className="text-primary text-decoration-none fw-bold">Sign In</Link>
        </p>
      </div>

    </div>
  );
};

export default SignupForm;