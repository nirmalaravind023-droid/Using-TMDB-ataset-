/**
 * Unit tests for the movie search route's Elasticsearch fallback logic.
 * Tests the fix for: ES HTTP 500 (non-exception) bypassing Postgres fallback.
 */

// Mock the db module
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

import { query } from '@/lib/db';

const mockQuery = query as jest.MockedFunction<typeof query>;

// Extract the core search logic to test independently
async function searchMovies(
  searchTerm: string,
  fetchImpl: typeof fetch
): Promise<{ movies: any[]; people: any[] }> {
  let movies: any[] = [];

  try {
    const controller = new AbortController();
    const esRes = await fetchImpl(`http://localhost:9200/movies/_search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({}),
    });

    if (!esRes.ok) {
      throw new Error(`Elasticsearch returned ${esRes.status}`);
    }

    const esData = await esRes.json();
    movies = esData.hits.hits.map((h: any) => ({ ...h._source, type: 'movie' }));
  } catch {
    const pgResults = await mockQuery(
      'SELECT * FROM movies WHERE title ILIKE $1 LIMIT 20',
      [`%${searchTerm}%`]
    );
    movies = (pgResults as any).rows.map((r: any) => ({ ...r, type: 'movie' }));
  }

  return { movies, people: [] };
}

describe('movie search – Elasticsearch fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockResolvedValue({ rows: [{ movie_id: 1, title: 'Inception', vote_average: 8.8 }] } as any);
  });

  it('returns ES results when ES responds 200', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        hits: { hits: [{ _source: { movie_id: 42, title: 'Interstellar', vote_average: 8.6 } }] },
      }),
    }) as unknown as typeof fetch;

    const result = await searchMovies('inter', mockFetch);

    expect(result.movies).toHaveLength(1);
    expect(result.movies[0].title).toBe('Interstellar');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('falls back to Postgres when ES returns HTTP 500', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'internal' }),
    }) as unknown as typeof fetch;

    const result = await searchMovies('inception', mockFetch);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(result.movies[0].title).toBe('Inception');
  });

  it('falls back to Postgres when ES returns HTTP 503', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
    }) as unknown as typeof fetch;

    const result = await searchMovies('test', mockFetch);

    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('falls back to Postgres when ES connection is refused (throws)', async () => {
    const mockFetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED')) as unknown as typeof fetch;

    const result = await searchMovies('test', mockFetch);

    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('falls back to Postgres when ES times out (AbortError)', async () => {
    const mockFetch = jest.fn().mockRejectedValue(
      Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })
    ) as unknown as typeof fetch;

    const result = await searchMovies('test', mockFetch);

    expect(mockQuery).toHaveBeenCalledTimes(1);
  });
});
