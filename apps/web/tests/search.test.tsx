import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SearchPage from '../src/features/search/SearchPage';
import { LibraryProvider } from '../src/contexts/LibraryContext';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SearchPage', () => {
  it('renders results after debounce', async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo) => {
      if (typeof input === 'string' && input.startsWith('/api/library')) {
        return {
          ok: true,
          json: async () => ({ shows: [] })
        };
      }
      return {
        ok: true,
        json: async () => ({
          results: [{ id: 1, title: 'Show 1', year: 2020, posterUrl: null }],
          page: 0,
          pageSize: 24,
          totalResults: 1,
          hasPrevPage: false,
          hasNextPage: false
        })
      };
    });
    vi.stubGlobal('fetch', fetchSpy);

    render(
      <LibraryProvider>
        <MemoryRouter>
          <SearchPage />
        </MemoryRouter>
      </LibraryProvider>
    );

    const input = screen.getByPlaceholderText('Search for a show');
    fireEvent.change(input, { target: { value: 'test' } });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    expect(await screen.findByText('Show 1')).toBeInTheDocument();
  });
});
