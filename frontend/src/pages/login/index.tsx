import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLogin } from '@/shared/api/hooks/auth';
import type { AxiosError } from 'axios';
import type { ErrorResponse } from '@/shared/api/types/auth';
import './Login.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mutate: login, isPending, isError } = useLogin();
  const [loginError, setLoginError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    login({ email, password }, {
      onSuccess: () => {
        navigate('/dashboard');
      },
      onError: (err: unknown) => {
        const error = err as AxiosError<ErrorResponse>;
        setLoginError(error?.response?.data?.message || t('login.errorDefault'));
      },
    });
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-split">
          <div className="login-split-left">
            <div className="login-brand">
              <h1>MyTravelBuddy</h1>
              <p className="brand-slogan">{t('login.brandSlogan')}</p>
            </div>

            <div className="login-form-container">
              <div className="login-form-header">
                <h2>{t('login.title')}</h2>
                <p>{t('login.subtitle')}</p>
              </div>

              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                  <label htmlFor="email">{t('login.email')}</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={isError ? 'error' : ''}
                    aria-describedby={isError ? 'email-error' : undefined}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">{t('login.password')}</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={isError ? 'error' : ''}
                    aria-describedby={isError ? 'password-error' : undefined}
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
                    {t('login.rememberMe')}
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-large btn-full-width"
                  disabled={isPending}
                >
                  {isPending ? t('login.submitting') : t('login.submit')}
                </button>

                {isError && loginError && (
                  <div className="error-message" id="login-error" role="alert">
                    {loginError}
                  </div>
                )}
              </form>

              <div className="login-footer">
                <p>
                  {t('login.noAccount')} <Link to="/register">{t('login.signUp')}</Link>
                </p>
              </div>
            </div>
          </div>

          <div className="login-split-right">
            <div className="login-visual">
              <div className="visual-content">
                <h2>{t('login.visualTitle')}</h2>
                <p>{t('login.visualSubtitle')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
