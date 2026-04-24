import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/shared/contexts/auth-context';
import PrivateRoute from '@/shared/components/PrivateRoute';

vi.mock('@/shared/api', () => ({
  apiClient: { interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
  setUnauthorizedHandler: vi.fn(),
}));

const Protected = () => <div>Защищённый контент</div>;
const LoginStub = () => <div>Страница входа</div>;

const renderWithRouter = (initialPath: string) => {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginStub />} />
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<Protected />} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('PrivateRoute', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('redirects to /login when not authenticated', async () => {
    renderWithRouter('/dashboard');
    await screen.findByText('Страница входа');
    expect(screen.queryByText('Защищённый контент')).not.toBeInTheDocument();
  });

  it('renders protected content when authenticated', async () => {
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('userName', 'Иван');
    localStorage.setItem('userEmail', 'ivan@test.com');
    renderWithRouter('/dashboard');
    await screen.findByText('Защищённый контент');
    expect(screen.queryByText('Страница входа')).not.toBeInTheDocument();
  });
});
