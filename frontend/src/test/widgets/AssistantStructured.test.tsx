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

  it('renders summary when present', () => {
    const structured: AssistantStructuredType = { summary: 'Москва — отличный выбор для поездки' };
    render(<AssistantStructured structured={structured} onShowOnMap={noop} />);
    expect(screen.getByText('Москва — отличный выбор для поездки')).toBeInTheDocument();
    expect(screen.getByText('Короткий вывод')).toBeInTheDocument();
  });

  it('renders plan items when present', () => {
    const structured: AssistantStructuredType = { plan: ['День 1: Третьяковка', 'День 2: Парк Горького'] };
    render(<AssistantStructured structured={structured} onShowOnMap={noop} />);
    expect(screen.getByText('День 1: Третьяковка')).toBeInTheDocument();
    expect(screen.getByText('День 2: Парк Горького')).toBeInTheDocument();
  });

  it('renders clarifying questions when present', () => {
    const structured: AssistantStructuredType = { questions: ['Предпочитаете музеи?', 'Есть ли дети?'] };
    render(<AssistantStructured structured={structured} onShowOnMap={noop} />);
    expect(screen.getByText('Предпочитаете музеи?')).toBeInTheDocument();
    expect(screen.getByText('Есть ли дети?')).toBeInTheDocument();
  });

  it('renders place cards for each place', () => {
    const structured: AssistantStructuredType = {
      places: [
        { name: 'Третьяковская галерея', day: 1, reason: 'Главный художественный музей' },
        { name: 'Красная площадь', day: 2 }
      ]
    };
    render(<AssistantStructured structured={structured} onShowOnMap={noop} />);
    expect(screen.getByText('Третьяковская галерея')).toBeInTheDocument();
    expect(screen.getByText(/Главный художественный музей/)).toBeInTheDocument();
    expect(screen.getByText('Красная площадь')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Показать на карте' })).toHaveLength(2);
  });

  it('calls onShowOnMap with a point when "Показать на карте" is clicked', async () => {
    const onShowOnMap = vi.fn();
    const structured: AssistantStructuredType = {
      places: [{ name: 'Третьяковская галерея', day: 1, reason: 'Музей' }]
    };
    render(<AssistantStructured structured={structured} onShowOnMap={onShowOnMap} />);
    await userEvent.click(screen.getByRole('button', { name: 'Показать на карте' }));
    expect(onShowOnMap).toHaveBeenCalledOnce();
    expect(onShowOnMap).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Третьяковская галерея' })
    );
  });

  it('does not render places section when places array is empty', () => {
    const structured: AssistantStructuredType = { summary: 'Хороший маршрут', places: [] };
    render(<AssistantStructured structured={structured} onShowOnMap={noop} />);
    expect(screen.queryByText('Предложенные места')).not.toBeInTheDocument();
  });
});
