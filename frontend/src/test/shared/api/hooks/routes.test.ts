import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import {
  useRoute,
  useUserRoutes,
  useRoutePage,
  useRouteMapData,
  useCreateRoute,
  useDeleteRoute,
} from '@/shared/api/hooks/routes';
import * as routesApi from '@/shared/api/routes';
import type { TravelRoute } from '@/shared/api/types/routes';

vi.mock('@/shared/api', () => ({
  apiClient: { interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
  setUnauthorizedHandler: vi.fn(),
}));

vi.mock('@/shared/api/routes');

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

const wrapper = (client: QueryClient) =>
  ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);

const mockRoute = (overrides: Partial<TravelRoute> = {}): TravelRoute => ({
  id: '42',
  userId: '7',
  name: 'Москва 2024',
  city: 'Москва',
  start_date: '2024-07-01',
  end_date: '2024-07-07',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('useRoute', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches a single route by id', async () => {
    vi.mocked(routesApi.getRoute).mockResolvedValue(mockRoute());
    const client = makeClient();
    const { result } = renderHook(() => useRoute('42'), { wrapper: wrapper(client) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('42');
    expect(routesApi.getRoute).toHaveBeenCalledWith('42');
  });

  it('does not fetch when id is empty', () => {
    vi.mocked(routesApi.getRoute).mockResolvedValue(mockRoute());
    const client = makeClient();
    renderHook(() => useRoute(''), { wrapper: wrapper(client) });
    expect(routesApi.getRoute).not.toHaveBeenCalled();
  });

  it('sets isError on failure', async () => {
    vi.mocked(routesApi.getRoute).mockRejectedValue(new Error('404'));
    const client = makeClient();
    const { result } = renderHook(() => useRoute('42'), { wrapper: wrapper(client) });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useUserRoutes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches all user routes', async () => {
    const routes = [mockRoute({ id: '1' }), mockRoute({ id: '2', name: 'СПб', city: 'СПб' })];
    vi.mocked(routesApi.getUserRoutes).mockResolvedValue(routes);
    const client = makeClient();
    const { result } = renderHook(() => useUserRoutes(), { wrapper: wrapper(client) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });

  it('returns empty array when no routes', async () => {
    vi.mocked(routesApi.getUserRoutes).mockResolvedValue([]);
    const client = makeClient();
    const { result } = renderHook(() => useUserRoutes(), { wrapper: wrapper(client) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe('useRoutePage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not fetch when id is empty', () => {
    vi.mocked(routesApi.getRoutePage).mockResolvedValue({} as never);
    const client = makeClient();
    renderHook(() => useRoutePage(''), { wrapper: wrapper(client) });
    expect(routesApi.getRoutePage).not.toHaveBeenCalled();
  });

  it('fetches route page data', async () => {
    const pageData = {
      route: mockRoute(),
      preferences: ['музеи'],
      route_points: [],
      weather: { status: 'ok', data: [], source: 'open-meteo', message: null },
      tickets: [],
    };
    vi.mocked(routesApi.getRoutePage).mockResolvedValue(pageData as never);
    const client = makeClient();
    const { result } = renderHook(() => useRoutePage('42'), { wrapper: wrapper(client) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(pageData);
  });
});

describe('useRouteMapData', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not fetch when id is empty', () => {
    vi.mocked(routesApi.getRouteMapData).mockResolvedValue({} as never);
    const client = makeClient();
    renderHook(() => useRouteMapData(''), { wrapper: wrapper(client) });
    expect(routesApi.getRouteMapData).not.toHaveBeenCalled();
  });

  it('fetches map data', async () => {
    const mapData = {
      status: 'ok',
      routeId: '42',
      city: 'Москва',
      center: { latitude: 55.75, longitude: 37.61 },
      points: [],
      chat_suggestions: [],
    };
    vi.mocked(routesApi.getRouteMapData).mockResolvedValue(mapData as never);
    const client = makeClient();
    const { result } = renderHook(() => useRouteMapData('42'), { wrapper: wrapper(client) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.routeId).toBe('42');
  });
});

describe('useCreateRoute', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a route and invalidates list', async () => {
    const created = mockRoute({ id: '99', name: 'Новая', city: 'Казань' });
    vi.mocked(routesApi.createRoute).mockResolvedValue(created);
    vi.mocked(routesApi.getUserRoutes).mockResolvedValue([]);

    const client = makeClient();
    const { result } = renderHook(() => useCreateRoute(), { wrapper: wrapper(client) });

    result.current.mutate({
      name: 'Новая',
      city: 'Казань',
      start_date: '2024-08-01',
      end_date: '2024-08-07',
      items: [],
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('99');
  });
});

describe('useDeleteRoute', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deletes a route', async () => {
    vi.mocked(routesApi.deleteRoute).mockResolvedValue(undefined);
    vi.mocked(routesApi.getUserRoutes).mockResolvedValue([]);

    const client = makeClient();
    const { result } = renderHook(() => useDeleteRoute(), { wrapper: wrapper(client) });

    result.current.mutate('42');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(routesApi.deleteRoute).toHaveBeenCalledWith('42');
  });
});
