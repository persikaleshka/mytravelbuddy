import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RegisterPage from '@/pages/register';
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

const renderRegister = () => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('renders all form fields', () => {
    renderRegister();
    expect(screen.getByLabelText('Полное имя')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Создать аккаунт' })).toBeInTheDocument();
  });

  it('renders link to login page', () => {
    renderRegister();
    expect(screen.getByRole('link', { name: 'Войти' })).toBeInTheDocument();
  });

  it('disables button while submitting', async () => {
    vi.mocked(authApi.register).mockImplementation(() => new Promise(() => {}));
    renderRegister();
    await userEvent.type(screen.getByLabelText('Полное имя'), 'Иван');
    await userEvent.type(screen.getByLabelText('Email'), 'ivan@test.com');
    await userEvent.type(screen.getByLabelText('Пароль'), 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Создать аккаунт' }));
    expect(screen.getByRole('button', { name: 'Создание...' })).toBeDisabled();
  });

  it('shows error on failed registration', async () => {
    vi.mocked(authApi.register).mockRejectedValue({
      response: { data: { message: 'Email уже занят' } },
    });
    renderRegister();
    await userEvent.type(screen.getByLabelText('Полное имя'), 'Иван');
    await userEvent.type(screen.getByLabelText('Email'), 'ivan@test.com');
    await userEvent.type(screen.getByLabelText('Пароль'), 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Создать аккаунт' }));
    await waitFor(() =>
      expect(screen.getByText('Email уже занят')).toBeInTheDocument(),
    );
  });

  it('shows default error when server gives no message', async () => {
    vi.mocked(authApi.register).mockRejectedValue(new Error('Network'));
    renderRegister();
    await userEvent.type(screen.getByLabelText('Полное имя'), 'Иван');
    await userEvent.type(screen.getByLabelText('Email'), 'ivan@test.com');
    await userEvent.type(screen.getByLabelText('Пароль'), 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Создать аккаунт' }));
    await waitFor(() =>
      expect(
        screen.getByText('Не удалось зарегистрироваться. Попробуйте ещё раз.'),
      ).toBeInTheDocument(),
    );
  });

  it('renders brand slogan', () => {
    renderRegister();
    expect(screen.getByText(/Планируй идеальное путешествие/)).toBeInTheDocument();
  });
});
