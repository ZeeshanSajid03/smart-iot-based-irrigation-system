import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

// Import the separate components
import SignupForm from '../Components/SignupForm';
import AuthImage from '../Components/AuthImage';

const SignupPage = () => {
  return (
    <div className="container-fluid vh-100">
      <div className="row h-100">
        
        {/* --- LEFT COLUMN (SignupForm) --- */}
        <div className="col-12 col-md-8 d-flex justify-content-center h-100 overflow-y-auto">
           {/* Calling the component here */}
           <SignupForm />
        </div>

        {/* --- RIGHT COLUMN (AuthImage) --- */}
        <div className="col-md-4 d-none d-md-block h-100 p-0">
            {/* Reuse the same image component */}
            <AuthImage />
        </div>

      </div>
    </div>
  );
};

export default SignupPage;