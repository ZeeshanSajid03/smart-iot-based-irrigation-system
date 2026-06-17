import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

// Import the separate components
import LoginForm from '../components/LoginForm';
import AuthImage from '../components/AuthImage';

const LoginPage = () => {
  return (
    <div className="container-fluid vh-100">
      <div className="row h-100">
        
        {/* --- LEFT COLUMN (LoginForm) --- */}
        <div className="col-12 col-md-8 d-flex justify-content-center h-100 overflow-y-auto">
           {/* Calling the component here */}
           <LoginForm />
        </div>

        {/* --- RIGHT COLUMN (AuthImage) --- */}
        <div className="col-md-4 d-none d-md-block h-100 p-0">
            {/* Calling the component here */}
            <AuthImage />
        </div>

      </div>
    </div>
  );
};

export default LoginPage;