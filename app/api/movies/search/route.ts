import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('q');

    if (!searchTerm) {
      const results = await query('SELECT * FROM movies ORDER BY vote_average DESC LIMIT 20');
      return NextResponse.json({ movies: results.rows, people: [] });
    }

    // --- MULTI-PASS GOOGLE-STYLE SEARCH ---
    
    // 1. Exact & Fuzzy Search (ElasticSearch/Postgres)
    let movies = [];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2-second fail-fast timeout

      const esUrl = process.env.ELASTICSEARCH_URL ?? 'http://localhost:9200';
      try {
        const esRes = await fetch(`${esUrl}/movies/_search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            query: {
              bool: {
                should: [
                  { match_phrase: { title: { query: searchTerm, boost: 5 } } },
                  { match: { title: { query: searchTerm, fuzziness: 'AUTO' } } }
                ]
              }
            },
            size: 20
          })
        });
        if (!esRes.ok) {
          throw new Error(`Elasticsearch returned ${esRes.status}`);
        }
        const esData = await esRes.json();
        movies = esData.hits.hits.map((h: any) => ({ ...h._source, type: 'movie' }));
        if (movies.length === 0) {
          const pgResults = await query(
            `SELECT *, CASE WHEN title = $1 THEN 1 WHEN title ILIKE $1 THEN 2 WHEN title ILIKE $2 THEN 3 ELSE 4 END as priority
             FROM movies WHERE title ILIKE $2 ORDER BY priority ASC, vote_average DESC NULLS LAST LIMIT 20`,
            [searchTerm, `%${searchTerm}%`]
          );
          movies = pgResults.rows.map(r => ({ ...r, type: 'movie' }));
        }
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (e) {
      // Postgres Fallback with Exact Match Priority
      const pgResults = await query(
        `SELECT *, 
          CASE WHEN title = $1 THEN 1 
               WHEN title ILIKE $1 THEN 2
               WHEN title ILIKE $2 THEN 3
               ELSE 4 END as priority
         FROM movies 
         WHERE title ILIKE $2 
         ORDER BY priority ASC, vote_average DESC NULLS LAST LIMIT 20`,
        [searchTerm, `%${searchTerm}%`]
      );
      movies = pgResults.rows.map(r => ({ ...r, type: 'movie' }));
    }

    // 2. Regional Discovery Pass (TMDB - Kannada, Tamil, Telugu, Malayalam)
    let regionalMovies = [];
    try {
       // We search TMDB specifically for regional results to provide that "Google Search" depth
       const tmdbRegionalRes = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(searchTerm)}&include_adult=false&region=IN`);
       if (tmdbRegionalRes.ok) {
          const regionalData = await tmdbRegionalRes.json();
          regionalMovies = regionalData.results?.map(m => ({
            movie_id: m.id,
            title: m.title,
            poster_path: m.poster_path,
            vote_average: m.vote_average,
            release_date: m.release_date,
            original_language: m.original_language,
            type: 'movie',
            is_regional: ['kn', 'ta', 'te', 'ml'].includes(m.original_language)
          })) || [];
       } else if (tmdbRegionalRes.status === 401) {
          console.error('TMDB API key invalid or missing');
       } else if (tmdbRegionalRes.status === 429) {
          console.warn('TMDB rate limit hit; skipping regional results');
       }
    } catch(e) {}

    // 3. People Search
    let people = [];
    try {
      const personRes = await fetch(`https://api.themoviedb.org/3/search/person?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(searchTerm)}`);
      if (personRes.ok) {
        const personData = await personRes.json();
        people = personData.results?.slice(0, 10).map(p => ({
          id: p.id,
          name: p.name,
          profile_path: p.profile_path,
          known_for: p.known_for_department,
          type: 'person'
        })) || [];
      } else if (personRes.status === 401) {
        console.error('TMDB API key invalid or missing');
      } else if (personRes.status === 429) {
        console.warn('TMDB rate limit hit; skipping people results');
      }
    } catch (e) {}

    // --- COMBINE & DE-DUPLICATE ---
    // Merge results, prioritizing local/ES exact matches then regional hits
    const combinedMovies = [...movies];
    const movieIds = new Set(movies.map(m => m.movie_id || m.id));

    regionalMovies.forEach(rm => {
       if (!movieIds.has(rm.movie_id)) {
          combinedMovies.push(rm);
          movieIds.add(rm.movie_id);
       }
    });

    // Final sorting: Exact matches first, then high ratings
    const finalMovies = combinedMovies.sort((a, b) => {
       const aTitle = (a.title || '').toLowerCase();
       const bTitle = (b.title || '').toLowerCase();
       const term = searchTerm.toLowerCase();
       
       if (aTitle === term && bTitle !== term) return -1;
       if (bTitle === term && aTitle !== term) return 1;
       if (a.is_regional && !b.is_regional) return -1; // Give a slight nudge to regional if they match
       return (b.vote_average || 0) - (a.vote_average || 0);
    });

    return NextResponse.json({ movies: finalMovies.slice(0, 25), people });
  } catch (err) {
    console.error('Search error:', err);
    return NextResponse.json({ movies: [], people: [] }, { status: 500 });
  }
}
