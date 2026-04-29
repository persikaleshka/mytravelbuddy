import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssistantStructured from '@/widgets/assistant-structured/AssistantStructured';
import type { AssistantStructured as AssistantStructuredType } from '@/entities/chat/types';

const noop = vi.fn();

describe('AssistantStructured', () => {
  it('returns null when structured object is empty', () => {
    const { container } = render(<AssistantStructured structured={{}} onShowOnMap={noop} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders string summary', () => {
    const structured: AssistantStructuredType = { summary: 'Москва — отличный выбор' };
    render(<AssistantStructured structured={structured} onShowOnMap={noop} />);
    expect(screen.getByText('Москва — отличный выбор')).toBeInTheDocument();
    expect(screen.getByText('Короткий вывод')).toBeInTheDocument();
  });

  it('renders array summary as list', () => {
    const structured: AssistantStructuredType = { summary: ['Пункт 1', 'Пункт 2'] };
    render(<AssistantStructured structured={structured} onShowOnMap={noop} />);
    expect(screen.getByText('Пункт 1')).toBeInTheDocument();
    expect(screen.getByText('Пункт 2')).toBeInTheDocument();
  });

  it('renders plan items', () => {
    const structured: AssistantStructuredType = {
      plan: ['День 1: Третьяковка', 'День 2: Парк Горького'],
    };
    render(<AssistantStructured structured={structured} onShowOnMap={noop} />);
    expect(screen.getByText('День 1: Третьяковка')).toBeInTheDocument();
    expect(screen.getByText('День 2: Парк Горького')).toBeInTheDocument();
    expect(screen.getByText('План/советы')).toBeInTheDocument();
  });

  it('renders clarifying questions', () => {
    const structured: AssistantStructuredType = {
      questions: ['Предпочитаете музеи?', 'Есть ли дети?'],
    };
    render(<AssistantStructured structured={structured} onShowOnMap={noop} />);
    expect(screen.getByText('Предпочитаете музеи?')).toBeInTheDocument();
    expect(screen.getByText('Есть ли дети?')).toBeInTheDocument();
    expect(screen.getByText('Вопросы для уточнения')).toBeInTheDocument();
  });

  it('renders place cards', () => {
    const structured: AssistantStructuredType = {
      places: [
        { name: 'Третьяковская галерея', day: 1, reason: 'Главный музей' },
        { name: 'Красная площадь', day: 2 },
      ],
    };
    render(<AssistantStructured structured={structured} onShowOnMap={noop} />);
    expect(screen.getByText('Третьяковская галерея')).toBeInTheDocument();
    expect(screen.getByText('Красная площадь')).toBeInTheDocument();
    expect(screen.getByText('Причина: Главный музей')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Показать на карте' })).toHaveLength(2);
  });

  it('does not call onShowOnMap when place has no coordinates', async () => {
    const onShowOnMap = vi.fn();
    const structured: AssistantStructuredType = {
      places: [{ name: 'Место без координат' }],
    };
    render(<AssistantStructured structured={structured} onShowOnMap={onShowOnMap} />);
    await userEvent.click(screen.getByRole('button', { name: 'Показать на карте' }));
    expect(onShowOnMap).not.toHaveBeenCalled();
  });

  it('calls onShowOnMap with correct point when coordinates are present', async () => {
    const onShowOnMap = vi.fn();
    const structured: AssistantStructuredType = {
      places: [
        {
          name: 'Третьяковская галерея',
          latitude: 55.7415,
          longitude: 37.6208,
          day: 1,
          reason: 'Музей',
        },
      ],
    };
    render(<AssistantStructured structured={structured} onShowOnMap={onShowOnMap} />);
    await userEvent.click(screen.getByRole('button', { name: 'Показать на карте' }));
    expect(onShowOnMap).toHaveBeenCalledOnce();
    expect(onShowOnMap).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Третьяковская галерея',
        latitude: 55.7415,
        longitude: 37.6208,
      }),
    );
  });

  it('does not render places section when places array is empty', () => {
    const structured: AssistantStructuredType = { summary: 'Хороший маршрут', places: [] };
    render(<AssistantStructured structured={structured} onShowOnMap={noop} />);
    expect(screen.queryByText('Предложенные места')).not.toBeInTheDocument();
  });

  it('renders all sections together', () => {
    const structured: AssistantStructuredType = {
      summary: 'Краткий вывод',
      plan: ['Шаг 1'],
      questions: ['Вопрос?'],
      places: [{ name: 'Кремль' }],
    };
    render(<AssistantStructured structured={structured} onShowOnMap={noop} />);
    expect(screen.getByText('Короткий вывод')).toBeInTheDocument();
    expect(screen.getByText('План/советы')).toBeInTheDocument();
    expect(screen.getByText('Вопросы для уточнения')).toBeInTheDocument();
    expect(screen.getByText('Предложенные места')).toBeInTheDocument();
  });
});
