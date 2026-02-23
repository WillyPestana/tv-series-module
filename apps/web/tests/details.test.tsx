import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DetailsPage from '../src/features/details/DetailsPage';
import { LibraryProvider } from '../src/contexts/LibraryContext';

const createResponse = (payload: unknown) => ({
  ok: true,
  json: async () => payload
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DetailsPage', () => {
  it('loads details and toggles watched', async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      if (typeof input === 'string' && input.startsWith('/api/library')) {
        return createResponse({ shows: [] });
      }
      if (typeof input === 'string' && input.startsWith('/api/shows/')) {
        return createResponse({
          id: 1,
          title: 'Show',
          summary: null,
          genres: ['Drama'],
          posterUrl: null,
          seasons: [
            {
              season: 1,
              episodes: [
                { id: 11, name: 'Ep1', season: 1, number: 1, summary: null, watched: false }
              ]
            }
          ],
          comments: [],
          ratings: [],
          ratingSummary: { average: null, count: 0 }
        });
      }
      if (typeof input === 'string' && input.includes('/watched')) {
        return createResponse({ status: 'ok' });
      }
      return createResponse({});
    });

    vi.stubGlobal('fetch', fetchSpy);

    render(
      <LibraryProvider>
        <MemoryRouter initialEntries={['/shows/1']}>
          <Routes>
            <Route path="/shows/:id" element={<DetailsPage />} />
          </Routes>
        </MemoryRouter>
      </LibraryProvider>
    );

    expect(await screen.findByText('Show')).toBeInTheDocument();
    const checkbox = await screen.findByRole('checkbox');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/episodes/11/watched',
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  it('adds a comment', async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      if (typeof input === 'string' && input.startsWith('/api/library')) {
        return createResponse({ shows: [] });
      }
      if (typeof input === 'string' && input.startsWith('/api/shows/')) {
        return createResponse({
          id: 1,
          title: 'Show',
          summary: null,
          genres: ['Drama'],
          posterUrl: null,
          seasons: [],
          comments: [],
          ratings: [],
          ratingSummary: { average: null, count: 0 }
        });
      }
      if (typeof input === 'string' && input === '/api/comments' && init?.method === 'POST') {
        return createResponse({
          comment: {
            id: 'c1',
            showId: 1,
            episodeId: null,
            author: 'Ana',
            text: 'Nice',
            createdAt: '2025-01-01T00:00:00Z'
          }
        });
      }
      return createResponse({});
    });

    vi.stubGlobal('fetch', fetchSpy);

    render(
      <LibraryProvider>
        <MemoryRouter initialEntries={['/shows/1']}>
          <Routes>
            <Route path="/shows/:id" element={<DetailsPage />} />
          </Routes>
        </MemoryRouter>
      </LibraryProvider>
    );

    await screen.findByText('Show');
    fireEvent.change(screen.getByPlaceholderText('Write a comment'), {
      target: { value: 'Nice' }
    });
    fireEvent.click(screen.getByText('Add comment'));

    await waitFor(() => expect(screen.getByText('Nice')).toBeInTheDocument());
  });
});
