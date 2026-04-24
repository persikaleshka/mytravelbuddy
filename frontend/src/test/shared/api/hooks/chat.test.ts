import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useRouteMessages, useSendRouteMessage } from '@/shared/api/hooks/chat';
import * as chatApi from '@/shared/api/chat';
import type { ChatMessage } from '@/entities/chat/types';

vi.mock('@/shared/api', () => ({
  apiClient: { interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
  setUnauthorizedHandler: vi.fn(),
}));

vi.mock('@/shared/api/chat');

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

const wrapper = (client: QueryClient) =>
  ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);

const mockMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: '1',
  routeId: '42',
  userId: '7',
  sender: 'assistant',
  text: 'Привет',
  formattedText: 'Привет',
  createdAt: '2024-01-01T10:00:00Z',
  ...overrides,
});

describe('useRouteMessages', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns messages for a route', async () => {
    const messages = [mockMessage({ id: '1', sender: 'user', text: 'Привет' })];
    vi.mocked(chatApi.getRouteMessages).mockResolvedValue(messages);

    const client = makeClient();
    const { result } = renderHook(() => useRouteMessages('42'), { wrapper: wrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(messages);
    expect(chatApi.getRouteMessages).toHaveBeenCalledWith('42');
  });

  it('does not fetch when routeId is empty', () => {
    vi.mocked(chatApi.getRouteMessages).mockResolvedValue([]);
    const client = makeClient();
    renderHook(() => useRouteMessages(''), { wrapper: wrapper(client) });
    expect(chatApi.getRouteMessages).not.toHaveBeenCalled();
  });

  it('returns empty array on error', async () => {
    vi.mocked(chatApi.getRouteMessages).mockRejectedValue(new Error('Network error'));
    const client = makeClient();
    const { result } = renderHook(() => useRouteMessages('42'), { wrapper: wrapper(client) });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});

describe('useSendRouteMessage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends a message and returns response', async () => {
    const response = {
      user_message: mockMessage({ sender: 'user', text: 'Покажи музеи' }),
      assistant_message: mockMessage({ sender: 'assistant', text: 'Вот музеи...' }),
      map_points: [],
      assistant_structured: {},
    };
    vi.mocked(chatApi.sendRouteMessage).mockResolvedValue(response);
    vi.mocked(chatApi.getRouteMessages).mockResolvedValue([]);

    const client = makeClient();
    const { result } = renderHook(() => useSendRouteMessage('42'), { wrapper: wrapper(client) });

    result.current.mutate({ text: 'Покажи музеи' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(chatApi.sendRouteMessage).toHaveBeenCalledWith('42', { text: 'Покажи музеи' });
    expect(result.current.data).toEqual(response);
  });

  it('sets error state when send fails', async () => {
    vi.mocked(chatApi.sendRouteMessage).mockRejectedValue(new Error('500'));
    const client = makeClient();
    const { result } = renderHook(() => useSendRouteMessage('42'), { wrapper: wrapper(client) });

    result.current.mutate({ text: 'Тест' });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
