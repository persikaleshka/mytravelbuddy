import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegister } from '@/shared/api/hooks/auth';
import type { AxiosError } from 'axios';
import type { ErrorResponse } from '@/shared/api/types/auth';
import '../login/Login.css';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { mutate: register, isPending, isError } = useRegister();
  const [registerError, setRegisterError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    register({ name, email, password }, {
      onSuccess: () => {
        navigate('/');
      },
      onError: (err: unknown) => {
        const error = err as AxiosError<ErrorResponse>;
        setRegisterError(error?.response?.data?.message || 'Failed to register. Please try again.');
      }
    });
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-split">
          <div className="login-split-left">
            <div className="login-brand">
              <h1>MyTravelBuddy</h1>
              <p className="brand-slogan">Plan your perfect journey with AI</p>
            </div>
            
            <div className="login-form-container">
              <div className="login-form-header">
                <h2>Create an account</h2>
                <p>Join thousands of travelers planning perfect trips</p>
              </div>
              
              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={isError ? 'error' : ''}
                    aria-describedby={isError ? "email-error" : undefined}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={isError ? 'error' : ''}
                    aria-describedby={isError ? "password-error" : undefined}
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary btn-large btn-full-width"
                  disabled={isPending}
                >
                  {isPending ? 'Creating account...' : 'Create account'}
                </button>
                
                {isError && registerError && (
                  <div className="error-message" id="register-error" role="alert">
                    {registerError}
                  </div>
                )}
              </form>
              
              <div className="login-footer">
                <p>
                  Already have an account? <a href="/login">Sign in</a>
                </p>
              </div>
            </div>
          </div>
          
          <div className="login-split-right">
            <div className="login-visual">
              <div className="visual-content">
                <h2>Start planning your dream trip</h2>
                <p>Join thousands of travelers who use MyTravelBuddy to create perfect itineraries</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;