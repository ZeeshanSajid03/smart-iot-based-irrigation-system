import React, { useState, useEffect } from 'react';
import { FaPencilAlt, FaSave, FaTimes } from 'react-icons/fa';

const ProfileField = ({ label, value, fieldName, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value || "");
  const [confirmPassword, setConfirmPassword] = useState(""); // 👈 New State for Password

  useEffect(() => {
    setTempValue(value || "");
  }, [value]);

  const handleSave = () => {
    // --- 1. DETAILED EMAIL VALIDATION ---
    if (fieldName === 'email') {
        const emailParts = tempValue.split('@');

        // Check A: Basic Structure
        if (emailParts.length !== 2 || !emailParts[0] || !emailParts[1]) {
            alert("Invalid Email Format! Missing '@' or incomplete address.");
            return;
        }

        const [localPart, domainPart] = emailParts;
        const domainLower = domainPart.toLowerCase();

        // Check B: Domain Whitelist
        const allowedDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com'];
        if (!allowedDomains.includes(domainLower)) {
            alert(`We do not support "@${domainLower}". Please use Gmail, Outlook, Yahoo, or Hotmail.`);
            return;
        }

        // Check C: Username Characters
        const validUsernameRegex = /^[a-zA-Z0-9._-]+$/;
        if (!validUsernameRegex.test(localPart)) {
            const invalidChar = localPart.match(/[^a-zA-Z0-9._-]/);
            const charShow = invalidChar ? invalidChar[0] : "symbol";
            alert(`Invalid character "${charShow}" in email. Only letters, numbers, dots (.), and underscores (_) are allowed.`);
            return;
        }

        // 👇 SECURITY CHECK: Require Password for Email Change
        if (!confirmPassword) {
            alert("Security Check: Please enter your current password to change your email.");
            return;
        }
    }

    // --- 2. STRICT PAKISTANI PHONE VALIDATION ---
    if (fieldName === 'phone') {
        const pakPhoneRegex = /^(\+92|0)3\d{2}[- ]?\d{7}$/;

        if (!pakPhoneRegex.test(tempValue)) {
            alert("Invalid Pakistani Number! Must start with '03' or '+923'.\n\nAllowed Formats:\n- 03001234567\n- 0300-1234567\n- 0300 1234567");
            return; 
        }

        if (tempValue.length < 10 || tempValue.length > 14) {
            alert("Invalid Length! Phone number is too short or too long.");
            return;
        }
    }

    // Save if all checks pass (Pass confirmPassword too)
    onSave(fieldName, tempValue, confirmPassword);
    
    setIsEditing(false);
    setConfirmPassword(""); // Clear password field
  };

  const handleCancel = () => {
    setTempValue(value || "");
    setConfirmPassword("");
    setIsEditing(false);
  };

  return (
    <div className="mb-3 d-flex justify-content-between align-items-center p-3 rounded-3" style={{backgroundColor: '#316150', border: '1px solid rgba(255,255,255,0.1)'}}>
      {isEditing ? (
        <div className="d-flex flex-column w-100 gap-2">
            
            {/* Input Field */}
            <div className="d-flex align-items-center gap-2">
                <strong className="text-light me-2">{label}:</strong>
                <input 
                    type={fieldName === 'email' ? 'email' : 'text'}
                    className="form-control bg-light" 
                    value={tempValue} 
                    onChange={(e) => setTempValue(e.target.value)}
                />
            </div>

            {/* 👇 SECURITY: Password Input (Only shows for Email) */}
            {fieldName === 'email' && (
                <div className="d-flex align-items-center gap-2">
                    <strong className="text-warning small me-2">Password:</strong>
                    <input 
                        type="password"
                        className="form-control bg-light"
                        placeholder="Required for security"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>
            )}

            {/* Buttons */}
            <div className="d-flex justify-content-end gap-2 mt-2">
                <button onClick={handleSave} className="btn btn-sm btn-success px-3"><FaSave /> Save</button>
                <button onClick={handleCancel} className="btn btn-sm btn-outline-light px-3"><FaTimes /> Cancel</button>
            </div>
        </div>
      ) : (
        <>
          <div className="text-truncate" style={{ maxWidth: '90%' }}>
            <strong className="text-light me-2">{label}:</strong>
            <span className="text-white">{value}</span>
          </div>
          <button onClick={() => setIsEditing(true)} className="btn btn-link text-light p-0">
            <FaPencilAlt size={18} />
          </button>
        </>
      )}
    </div>
  );
};

export default ProfileField;