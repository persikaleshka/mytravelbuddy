import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CreateTripPage from '@/pages/create-trip';
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

const renderCreateTrip = () => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AuthProvider>
          <CreateTripPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const mockCreatedRoute = (): TravelRoute => ({
  id: '99',
  userId: '1',
  name: 'Москва',
  city: 'Москва',
  start_date: '2024-07-01',
  end_date: '2024-07-07',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
});

describe('CreateTripPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('renders all form fields', () => {
    renderCreateTrip();
    expect(screen.getByLabelText('Название поездки')).toBeInTheDocument();
    expect(screen.getByLabelText('Город')).toBeInTheDocument();
    expect(screen.getByLabelText('Дата начала')).toBeInTheDocument();
    expect(screen.getByLabelText('Дата окончания')).toBeInTheDocument();
    expect(screen.getByLabelText('Интересы')).toBeInTheDocument();
  });

  it('renders cancel and submit buttons', () => {
    renderCreateTrip();
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Создать поездку' })).toBeInTheDocument();
  });

  it('cancel navigates to dashboard', async () => {
    renderCreateTrip();
    await userEvent.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('shows creating state on submit', async () => {
    vi.mocked(routesApi.createRoute).mockImplementation(() => new Promise(() => {}));
    renderCreateTrip();
    await userEvent.type(screen.getByLabelText('Название поездки'), 'Москва');
    await userEvent.type(screen.getByLabelText('Город'), 'Москва');
    await userEvent.type(screen.getByLabelText('Дата начала'), '2024-07-01');
    await userEvent.type(screen.getByLabelText('Дата окончания'), '2024-07-07');
    await userEvent.click(screen.getByRole('button', { name: 'Создать поездку' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Создание...' })).toBeDisabled(),
    );
  });

  it('navigates to trip page on successful creation', async () => {
    vi.mocked(routesApi.createRoute).mockResolvedValue(mockCreatedRoute());
    vi.mocked(routesApi.getUserRoutes).mockResolvedValue([]);
    renderCreateTrip();
    await userEvent.type(screen.getByLabelText('Название поездки'), 'Москва');
    await userEvent.type(screen.getByLabelText('Город'), 'Москва');
    await userEvent.type(screen.getByLabelText('Дата начала'), '2024-07-01');
    await userEvent.type(screen.getByLabelText('Дата окончания'), '2024-07-07');
    await userEvent.click(screen.getByRole('button', { name: 'Создать поездку' }));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/trip/99', { state: { isNew: true } }),
    );
  });

  it('shows error message on creation failure', async () => {
    vi.mocked(routesApi.createRoute).mockRejectedValue(
      Object.assign(new Error('Server error'), { message: 'Server error' }),
    );
    renderCreateTrip();
    await userEvent.type(screen.getByLabelText('Название поездки'), 'Москва');
    await userEvent.type(screen.getByLabelText('Город'), 'Москва');
    await userEvent.type(screen.getByLabelText('Дата начала'), '2024-07-01');
    await userEvent.type(screen.getByLabelText('Дата окончания'), '2024-07-07');
    await userEvent.click(screen.getByRole('button', { name: 'Создать поездку' }));
    await waitFor(() =>
      expect(screen.getByText(/Ошибка создания поездки/)).toBeInTheDocument(),
    );
  });

  it('inputs accept text correctly', async () => {
    renderCreateTrip();
    const nameInput = screen.getByLabelText('Название поездки');
    await userEvent.type(nameInput, 'Мой маршрут');
    expect(nameInput).toHaveValue('Мой маршрут');
  });
});
