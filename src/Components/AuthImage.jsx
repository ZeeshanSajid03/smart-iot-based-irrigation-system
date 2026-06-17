import React from 'react';

const plantImg = "/Plant.png"; 

const AuthImage = () => {
  return (
    <div className="h-100 w-100">
      <img 
        src={plantImg} 
        alt="Plant" 
        className="w-100 h-100 object-fit-cover" 
      />
    </div>
  );
};

export default AuthImage;