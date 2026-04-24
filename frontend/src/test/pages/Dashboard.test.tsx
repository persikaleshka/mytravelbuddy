import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from '@/pages/dashboard';
import { AuthProvider } from '@/shared/contexts/auth-context';
import type { TravelRoute } from '@/shared/api/types/routes';

vi.mock('@/shared/api', () => ({
  apiClient: { interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
  setUnauthorizedHandler: vi.fn(),
}));

vi.mock('@/shared/api/routes', () => ({
  getUserRoutes: vi.fn(),
  getRoute: vi.fn(),
  getRoutePage: vi.fn(),
  getRouteMapData: vi.fn(),
  createRoute: vi.fn(),
  updateRoute: vi.fn(),
  deleteRoute: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import * as routesApi from '@/shared/api/routes';

const renderDashboard = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const mockRoute = (id: string, name: string): TravelRoute => ({
  id,
  userId: '1',
  name,
  city: 'Москва',
  start_date: '2024-07-01',
  end_date: '2024-07-07',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
});

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('shows loading state initially', () => {
    vi.mocked(routesApi.getUserRoutes).mockImplementation(() => new Promise(() => {}));
    renderDashboard();
    expect(screen.getByText('Загрузка поездок...')).toBeInTheDocument();
  });

  it('shows empty state when no routes', async () => {
    vi.mocked(routesApi.getUserRoutes).mockResolvedValue([]);
    renderDashboard();
    await screen.findByText('У вас ещё нет поездок.');
    expect(screen.getByRole('button', { name: 'Создать первую поездку' })).toBeInTheDocument();
  });

  it('renders route cards when routes exist', async () => {
    vi.mocked(routesApi.getUserRoutes).mockResolvedValue([
      mockRoute('1', 'Москва 2024'),
      mockRoute('2', 'СПб 2024'),
    ]);
    renderDashboard();
    await screen.findByText('Москва 2024');
    expect(screen.getByText('СПб 2024')).toBeInTheDocument();
  });

  it('navigates to create-trip from empty state', async () => {
    vi.mocked(routesApi.getUserRoutes).mockResolvedValue([]);
    renderDashboard();
    await screen.findByText('Создать первую поездку');
    await userEvent.click(screen.getByRole('button', { name: 'Создать первую поездку' }));
    expect(mockNavigate).toHaveBeenCalledWith('/create-trip');
  });

  it('navigates to trip page when card is clicked', async () => {
    vi.mocked(routesApi.getUserRoutes).mockResolvedValue([mockRoute('42', 'Казань')]);
    renderDashboard();
    await screen.findByText('Казань');
    await userEvent.click(screen.getByText('Казань').closest('.route-card')!);
    expect(mockNavigate).toHaveBeenCalledWith('/trip/42');
  });

  it('shows error state when fetch fails', async () => {
    vi.mocked(routesApi.getUserRoutes).mockRejectedValue(new Error('Network'));
    renderDashboard();
    await screen.findByText(/Ошибка загрузки поездок/);
  });

  it('shows "Создать поездку" button in header', async () => {
    vi.mocked(routesApi.getUserRoutes).mockResolvedValue([mockRoute('1', 'Тест')]);
    renderDashboard();
    await screen.findByText('Тест');
    expect(screen.getByRole('button', { name: 'Создать поездку' })).toBeInTheDocument();
  });

  it('navigates to create-trip from header button', async () => {
    vi.mocked(routesApi.getUserRoutes).mockResolvedValue([]);
    renderDashboard();
    await screen.findByText('У вас ещё нет поездок.');
    await userEvent.click(screen.getByRole('button', { name: 'Создать поездку' }));
    expect(mockNavigate).toHaveBeenCalledWith('/create-trip');
  });
});
