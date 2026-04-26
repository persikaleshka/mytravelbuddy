import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlaceCard from '@/widgets/place-card/PlaceCard';

describe('PlaceCard', () => {
  it('renders the place name', () => {
    render(<PlaceCard name="Третьяковская галерея" onShowOnMap={vi.fn()} />);
    expect(screen.getByText('Третьяковская галерея')).toBeInTheDocument();
  });

  it('renders day when provided', () => {
    render(<PlaceCard name="Музей" day={2} onShowOnMap={vi.fn()} />);
    expect(screen.getByText('День: 2')).toBeInTheDocument();
  });

  it('does not render day label when day is undefined', () => {
    render(<PlaceCard name="Музей" onShowOnMap={vi.fn()} />);
    expect(screen.queryByText(/День:/)).not.toBeInTheDocument();
  });

  it('renders reason when provided', () => {
    render(<PlaceCard name="Музей" reason="Популярный музей" onShowOnMap={vi.fn()} />);
    expect(screen.getByText('Популярный музей')).toBeInTheDocument();
  });

  it('does not render reason label when reason is undefined', () => {
    render(<PlaceCard name="Музей" onShowOnMap={vi.fn()} />);
    expect(screen.queryByText(/Причина:/)).not.toBeInTheDocument();
  });

  it('calls onShowOnMap when button is clicked', async () => {
    const onShowOnMap = vi.fn();
    render(<PlaceCard name="Музей" onShowOnMap={onShowOnMap} />);
    await userEvent.click(screen.getByRole('button', { name: 'Показать на карте' }));
    expect(onShowOnMap).toHaveBeenCalledOnce();
  });

  it('renders all fields together', () => {
    render(
      <PlaceCard
        name="Красная площадь"
        day={1}
        reason="Главная достопримечательность"
        onShowOnMap={vi.fn()}
      />,
    );
    expect(screen.getByText('Красная площадь')).toBeInTheDocument();
    expect(screen.getByText('День: 1')).toBeInTheDocument();
    expect(screen.getByText('Главная достопримечательность')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Показать на карте' })).toBeInTheDocument();
  });
});
