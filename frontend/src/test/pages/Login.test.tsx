import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from '@/pages/login';
import { AuthProvider } from '@/shared/contexts/auth-context';

vi.mock('@/shared/api', () => ({
  apiClient: { interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
  setUnauthorizedHandler: vi.fn(),
}));

vi.mock('@/shared/api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import * as authApi from '@/shared/api/auth';

const renderLogin = () => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('renders form fields and submit button', () => {
    renderLogin();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument();
  });

  it('renders link to register page', () => {
    renderLogin();
    expect(screen.getByRole('link', { name: 'Зарегистрироваться' })).toBeInTheDocument();
  });

  it('disables submit button while submitting', async () => {
    vi.mocked(authApi.login).mockImplementation(() => new Promise(() => {}));
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'test@test.com');
    await userEvent.type(screen.getByLabelText('Пароль'), 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }));
    expect(screen.getByRole('button', { name: 'Вход...' })).toBeDisabled();
  });

  it('shows error message on failed login', async () => {
    vi.mocked(authApi.login).mockRejectedValue({
      response: { data: { message: 'Неверный пароль' } },
    });
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'test@test.com');
    await userEvent.type(screen.getByLabelText('Пароль'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }));
    await waitFor(() =>
      expect(screen.getByText('Неверный пароль')).toBeInTheDocument(),
    );
  });

  it('shows default error when no message from server', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error('Network'));
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'test@test.com');
    await userEvent.type(screen.getByLabelText('Пароль'), 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }));
    await waitFor(() =>
      expect(screen.getByText('Не удалось войти. Попробуйте ещё раз.')).toBeInTheDocument(),
    );
  });

  it('renders brand slogan', () => {
    renderLogin();
    expect(screen.getByText(/Планируй идеальное путешествие/)).toBeInTheDocument();
  });
});
