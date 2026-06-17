import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import axios from 'axios'; 
import { FaEye, FaEyeSlash } from 'react-icons/fa'; 

const logoImg = "/Logo.png"; 

const LoginForm = () => {
  const navigate = useNavigate();

  // Refs for native validation bubbles
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear custom validation errors when user types
    e.target.setCustomValidity('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        const result = await axios.post(`${import.meta.env.VITE_API_URL}/login`, {
            email: formData.email,
            password: formData.password
        });

        if (result.data.status === "success") {
            const loggedInUser = result.data.user;
            
            console.log("Login Success:", loggedInUser);
            
            // Save user to local storage so Profile page works
            localStorage.setItem("user", JSON.stringify(loggedInUser)); 
            
            // --- UPDATED ROUTING LOGIC ---
            if (loggedInUser.role === "admin") {
                navigate('/admin'); // Or '/admin-users' depending on your App.jsx routes
            } else {
                navigate('/dashboard');
            }

        } else {
            // Login Failed
            if (result.data.message.includes("password")) {
                passwordRef.current.setCustomValidity(result.data.message);
                passwordRef.current.reportValidity();
            } else {
                emailRef.current.setCustomValidity(result.data.message);
                emailRef.current.reportValidity();
            }
        }

    } catch (err) {
        console.error(err);
        alert("Server error. Check if backend is running.");
    }
  };

  return (
    <div className="form-container w-100 px-4 py-5 my-auto" style={{ maxWidth: '550px' }}>
      
      <div className="text-center mb-4">
        <img src={logoImg} alt="Logo" className="mb-3" style={{ width: '100px', height: 'auto' }} />
        <h2 className="fw-bold text-secondary">Log In</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label text-muted fw-bold small">Email address</label>
          <input 
            type="email" 
            name="email"
            ref={emailRef}
            className="form-control bg-light" 
            placeholder="example123@gmail.com" 
            value={formData.email}
            onChange={handleChange}
            required 
          />
        </div>

        {/* --- Password Field with Toggle --- */}
        <div className="mb-3">
          <label className="form-label text-muted fw-bold small">Password</label>
          <div className="input-group">
            <input 
                type={showPassword ? "text" : "password"} 
                name="password"
                ref={passwordRef}
                className="form-control bg-light border-end-0" 
                placeholder="••••••" 
                value={formData.password}
                onChange={handleChange}
                required
            />
            <span 
                className="input-group-text bg-light border-start-0" 
                style={{ cursor: 'pointer' }}
                onClick={() => setShowPassword(!showPassword)}
            >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
            </span>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="form-check">
            <input type="checkbox" className="form-check-input" id="rememberCheck" />
            <label className="form-check-label small text-muted" htmlFor="rememberCheck">
              Remember me
            </label>
          </div>
          
          <Link to="/forgot-password" className="small text-decoration-none custom-green-text fw-bold">
            Forgot Password?
          </Link>
          
        </div>

        <button type="submit" className="btn w-100 btn-lg mb-4 custom-green-btn text-white">
          Login
        </button>
      </form>

      <div className="text-center mt-4">
        <p className="text-muted small">
          Don't have an account? <Link to="/signup" className="text-primary text-decoration-none fw-bold">Sign Up</Link>
        </p>
      </div>

    </div>
  );
};

export default LoginForm;