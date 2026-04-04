import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (localStorage.getItem('token')) {
      navigate('/dashboard');
    }
  }, [navigate]);
  
  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Discover Your Perfect Travel Experience</h1>
          <p className="hero-subtitle">
            Create personalized travel itineraries with AI-powered recommendations tailored to your interests and budget.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-large" onClick={handleGetStarted}>Get Started</button>
          </div>
        </div>
      </section>
      
      <section className="middle-section">
        <div className="middle-content">
          <h2>Welcome to MyTravelBuddy</h2>
          <p>Your ultimate travel companion for planning unforgettable journeys.</p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;