import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; 
import { FaPlus, FaCamera, FaLock, FaTimes, FaPen, FaSave, FaEnvelope, FaPhone } from 'react-icons/fa';
import { Modal } from 'react-bootstrap'; 

const ProfilePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [userData, setUserData] = useState({
    photoUrl: null, 
    firstName: '', 
    lastName: '',  
    username: '',
    email: '',
    phone: ''      
  });

  // --- EDITING STATES ---
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [tempEmail, setTempEmail] = useState("");
  const [emailAuthPassword, setEmailAuthPassword] = useState(""); 

  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [tempPhone, setTempPhone] = useState("");

  // --- MODAL STATES ---
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [passData, setPassData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [otp, setOtp] = useState("");
  const [pendingChange, setPendingChange] = useState({ field: '', value: '' });

  // Timer: 120 seconds (2 mins)
  const [timer, setTimer] = useState(120); 

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserData({
            ...parsedUser,
            phone: parsedUser.phone || '' 
        });
    }
  }, []);

  // --- COUNTDOWN LOGIC ---
  useEffect(() => {
      let interval;
      if (showOtpModal && timer > 0) {
          interval = setInterval(() => {
              setTimer((prev) => prev - 1);
          }, 1000);
      } else if (timer === 0) {
          clearInterval(interval);
      }
      return () => clearInterval(interval);
  }, [showOtpModal, timer]);

  const formatTime = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleFieldSave = async (fieldName, newValue) => {
    try {
        const identifierEmail = userData.email; 
        setUserData(prev => ({ ...prev, [fieldName]: newValue }));

        const response = await axios.post(`${import.meta.env.VITE_API_URL}/update-profile`, {
            email: identifierEmail, 
            fieldName: fieldName,
            newValue: newValue
        });

        if (response.data.status === "success") {
            updateLocalStorage(response.data.user);
            return true; 
        } else {
            alert("Failed to save. " + response.data.message);
            return false;
        }
    } catch (err) {
        alert("Server Error: Could not save.");
        return false;
    }
  };

  const requestSensitiveChange = async (fieldName, newValue, password) => {
      try {
          const res = await axios.post(`${import.meta.env.VITE_API_URL}/request-sensitive-change`, {
              email: userData.email,
              fieldName: fieldName,
              newValue: newValue,
              password: password
          });

          if (res.data.status === "otp_sent") {
              setPendingChange({ field: fieldName, value: newValue });
              setShowPasswordModal(false);
              setIsEditingEmail(false);    
              setEmailAuthPassword(""); 
              
              setTimer(120);   
              setShowOtpModal(true);       
              alert(res.data.message);     
          } else {
              alert(res.data.message);
          }
      } catch (err) {
          alert("Server Error: Could not request change.");
      }
  };

  const handleVerifyOtp = async () => {
      try {
          const res = await axios.post(`${import.meta.env.VITE_API_URL}/verify-sensitive-change`, {
              email: userData.email,
              otp: otp
          });

          if (res.data.status === "success") {
              alert("Update Successful!");
              const updatedUser = { ...userData, ...res.data.user };
              if (pendingChange.field === 'email') updatedUser.email = pendingChange.value;

              updateLocalStorage(updatedUser);
              setUserData(updatedUser);
              setShowOtpModal(false);
              setOtp("");
              setPendingChange({ field: '', value: '' });
              setPassData({ oldPassword: '', newPassword: '', confirmPassword: '' });
          } else {
              alert(res.data.message);
          }
      } catch (err) {
          alert("Verification Failed.");
      }
  };

  const updateLocalStorage = (user) => {
      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(new Event("storage")); 
      
      // 👇 THE NEW SIGNAL LINE IS ADDED HERE 👇
      window.dispatchEvent(new Event("userProfileUpdated")); 
  };

  const handleImageClick = () => { fileInputRef.current.click(); };
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2000000) return alert("File too big!");
      const reader = new FileReader();
      reader.onloadend = () => {
          setUserData({ ...userData, photoUrl: reader.result });
          handleFieldSave('photoUrl', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmailSaveClick = async () => {
      if (!emailAuthPassword) {
          alert("Password is required for security.");
          return;
      }
      await requestSensitiveChange('email', tempEmail, emailAuthPassword);
  };

  const handlePhoneSaveClick = async () => {
      const success = await handleFieldSave('phone', tempPhone);
      if (success) setIsEditingPhone(false);
  };

  return (
    <div className="container mt-5">
      <h2 className="text-secondary fw-bold mb-4 mx-auto text-center">User Profile</h2>

      <div className="profile-card rounded-5 p-5 mx-auto d-flex flex-column align-items-center text-center position-relative shadow" style={{ maxWidth: '900px', backgroundColor: '#3d7b65' }}>
          
          {/* IMAGE SECTION */}
          <div className="mb-4 position-relative">
              <div 
                  className="rounded-circle d-flex align-items-center justify-content-center bg-secondary bg-opacity-25 clickable-image border border-3 border-light"
                  onClick={handleImageClick}
                  style={{ width: '150px', height: '150px', cursor: 'pointer', overflow: 'hidden', backgroundColor: '#e9ecef' }}
              >
                  {userData.photoUrl ? (
                      <img src={userData.photoUrl} alt="Profile" className="w-100 h-100 object-fit-cover" />
                  ) : (
                      <FaPlus className="text-white opacity-50 display-4" />
                  )}
              </div>
              <div className="position-absolute bottom-0 end-0 bg-success text-white rounded-circle p-2 shadow" style={{transform: 'translate(-10px, -10px)'}}>
                  <FaCamera size={14} />
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".jpg, .jpeg, .png" />
          </div>

          <div className="w-100" style={{ maxWidth: '600px' }}>
              
              <div className="row mb-3">
                  <div className="col-md-6 text-start">
                      <label className="text-white small fw-bold ms-2">First Name</label>
                      <div className="p-3 rounded-3 text-white bg-dark bg-opacity-25 border border-white border-opacity-10">{userData.firstName}</div>
                  </div>
                  <div className="col-md-6 text-start">
                      <label className="text-white small fw-bold ms-2">Last Name</label>
                      <div className="p-3 rounded-3 text-white bg-dark bg-opacity-25 border border-white border-opacity-10">{userData.lastName}</div>
                  </div>
              </div>

              <div className="mb-4 text-start">
                  <label className="text-white small fw-bold ms-2">Username</label>
                  <div className="p-3 rounded-3 text-white bg-dark bg-opacity-25 border border-white border-opacity-10">{userData.username}</div>
              </div>

              <hr className="border-white opacity-25 my-4"/>

              <h5 className="text-white text-start fw-bold mb-3">Contact Details</h5>
              
              {/* EMAIL SECTION */}
              <div className="mb-3 text-start">
                  {!isEditingEmail ? (
                      <div className="d-flex align-items-center justify-content-between p-3 rounded-3 text-white bg-dark bg-opacity-25 border border-white border-opacity-10">
                          <div className="text-truncate">
                              <span className="fw-bold me-2">Email Address:</span>
                              <span>{userData.email}</span>
                          </div>
                          <FaPen 
                             style={{ cursor: 'pointer' }}
                             className="text-white opacity-75 hover-opacity-100"
                             onClick={() => { setTempEmail(userData.email); setIsEditingEmail(true); }}
                          />
                      </div>
                  ) : (
                      <div className="p-3 rounded-3 bg-white shadow-sm text-dark">
                          <div className="mb-3">
                              <label className="small fw-bold text-secondary mb-1">New Email</label>
                              <div className="input-group">
                                  <span className="input-group-text bg-light border-end-0"><FaEnvelope className="text-muted"/></span>
                                  <input 
                                      type="email" 
                                      className="form-control border-start-0 ps-1" 
                                      value={tempEmail}
                                      onChange={(e) => setTempEmail(e.target.value)}
                                  />
                              </div>
                          </div>
                          <div className="mb-3">
                              <label className="small fw-bold text-warning mb-1">Password: Required for security</label>
                              <div className="input-group">
                                  <span className="input-group-text bg-light border-end-0"><FaLock className="text-muted"/></span>
                                  <input 
                                      type="password" 
                                      className="form-control border-start-0 ps-1" 
                                      placeholder="Enter current password"
                                      value={emailAuthPassword}
                                      onChange={(e) => setEmailAuthPassword(e.target.value)}
                                  />
                              </div>
                          </div>
                          <div className="d-flex gap-2 justify-content-end">
                              <button className="btn btn-sm btn-light text-danger fw-bold" onClick={() => { setIsEditingEmail(false); setEmailAuthPassword(""); }}>
                                  <FaTimes /> Cancel
                              </button>
                              <button className="btn btn-sm btn-success fw-bold px-3" onClick={handleEmailSaveClick}>
                                  <FaSave /> Save
                              </button>
                          </div>
                      </div>
                  )}
              </div>

              {/* PHONE SECTION */}
              <div className="mb-3 text-start">
                  {!isEditingPhone ? (
                      <div className="d-flex align-items-center justify-content-between p-3 rounded-3 text-white bg-dark bg-opacity-25 border border-white border-opacity-10">
                          <div className="text-truncate">
                              <span className="fw-bold me-2">Phone Number:</span>
                              <span>{userData.phone}</span>
                          </div>
                          <FaPen 
                             style={{ cursor: 'pointer' }}
                             className="text-white opacity-75 hover-opacity-100"
                             onClick={() => { setTempPhone(userData.phone); setIsEditingPhone(true); }}
                          />
                      </div>
                  ) : (
                      <div className="p-3 rounded-3 bg-white shadow-sm text-dark">
                          <div className="mb-3">
                              <label className="small fw-bold text-secondary mb-1">New Phone Number</label>
                              <div className="input-group">
                                  <span className="input-group-text bg-light border-end-0"><FaPhone className="text-muted"/></span>
                                  <input 
                                      type="text" 
                                      className="form-control border-start-0 ps-1" 
                                      value={tempPhone}
                                      onChange={(e) => setTempPhone(e.target.value)}
                                  />
                              </div>
                          </div>
                          <div className="d-flex gap-2 justify-content-end">
                              <button className="btn btn-sm btn-light text-danger fw-bold" onClick={() => setIsEditingPhone(false)}>
                                  <FaTimes /> Cancel
                              </button>
                              <button className="btn btn-sm btn-success fw-bold px-3" onClick={handlePhoneSaveClick}>
                                  <FaSave /> Save
                              </button>
                          </div>
                      </div>
                  )}
              </div>

              <div className="mt-4">
                  <button 
                    className="btn btn-warning w-100 py-3 fw-bold rounded-3 shadow-sm d-flex justify-content-center align-items-center gap-2"
                    onClick={() => setShowPasswordModal(true)}
                  >
                      <FaLock /> Change Password
                  </button>
              </div>

          </div>
      </div>

      {/* --- PASSWORD CHANGE MODAL --- */}
      {showPasswordModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-secondary">Change Password</h5>
                <button type="button" className="btn btn-sm" onClick={() => setShowPasswordModal(false)}><FaTimes /></button>
              </div>
              <div className="modal-body p-4">
                <form onSubmit={(e) => {
                    e.preventDefault();
                    if (passData.newPassword !== passData.confirmPassword) return alert("Passwords do not match");
                    requestSensitiveChange('password', passData.newPassword, passData.oldPassword);
                }}>
                    <div className="mb-3">
                        <input type="password" className="form-control bg-light" required placeholder="Current Password"
                            value={passData.oldPassword} onChange={(e) => setPassData({...passData, oldPassword: e.target.value})} />
                    </div>
                    <div className="mb-3">
                        <input type="password" className="form-control bg-light" required placeholder="New Password"
                            value={passData.newPassword} onChange={(e) => setPassData({...passData, newPassword: e.target.value})} />
                    </div>
                    <div className="mb-3">
                        <input type="password" className="form-control bg-light" required placeholder="Confirm New Password"
                            value={passData.confirmPassword} onChange={(e) => setPassData({...passData, confirmPassword: e.target.value})} />
                    </div>
                    <button type="submit" className="btn btn-success w-100 fw-bold mt-2">Request OTP</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- OTP MODAL WITH TIMER --- */}
      <Modal show={showOtpModal} onHide={() => setShowOtpModal(false)} centered>
        <Modal.Header closeButton>
            <Modal.Title className="h5 fw-bold text-secondary">Security Check</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-4">
            <p className="text-muted mb-2">
                {/* 👇 DYNAMIC TEXT: Updated to show which email the code was sent to */}
                We sent a security code to your <strong>{pendingChange.field === 'email' ? 'New Email' : 'Current Email'}</strong>.<br/>
                Please enter it to confirm your {pendingChange.field} update.
            </p>
            
            <p className={`fw-bold mb-4 ${timer < 30 ? 'text-danger' : 'text-success'}`}>
                Code expires in: {formatTime(timer)}
            </p>

            <input 
                type="text" 
                maxLength="4" 
                className="form-control text-center fw-bold fs-3 letter-spacing-2 mb-4"
                placeholder="0000"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
            />
            <button 
                onClick={handleVerifyOtp} 
                className="btn btn-success w-100 fw-bold"
                disabled={timer === 0} 
            >
                {timer === 0 ? "Expired" : "Verify & Update"}
            </button>
        </Modal.Body>
      </Modal>

    </div>
  );
};

export default ProfilePage;