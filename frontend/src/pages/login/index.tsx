import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '@/shared/api/hooks/auth';
import type { AxiosError } from 'axios';
import type { ErrorResponse } from '@/shared/api/types/auth';
import './Login.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { mutate: login, isPending, isError } = useLogin();
  const [loginError, setLoginError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    login({ email, password }, {
      onSuccess: () => {
        navigate('/');
      },
      onError: (err: unknown) => {
        const error = err as AxiosError<ErrorResponse>;
        setLoginError(error?.response?.data?.message || 'Failed to login. Please try again.');
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
                <h2>Welcome back</h2>
                <p>Sign in to your account</p>
              </div>
              
              <form onSubmit={handleSubmit} className="login-form">
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
                
                <div className="form-group form-group-checkbox">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Remember me
                  </label>
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary btn-large btn-full-width"
                  disabled={isPending}
                >
                  {isPending ? 'Signing in...' : 'Sign in'}
                </button>
                
                {isError && loginError && (
                  <div className="error-message" id="login-error" role="alert">
                    {loginError}
                  </div>
                )}
              </form>
              
              <div className="login-footer">
                <p>
                  Don't have an account? <a href="/register">Sign up</a>
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

export default LoginPage;