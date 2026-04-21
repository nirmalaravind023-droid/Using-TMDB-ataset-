import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'popular';
  const timeframe = searchParams.get('timeframe') || '30days';
  const sortBy = searchParams.get('sortBy') || 'popularity.desc';
  const language = searchParams.get('language') || '';
  const region = searchParams.get('region') || '';
  const page = searchParams.get('page') || '1';
  const with_genres = searchParams.get('with_genres') || '';
  const with_original_language = searchParams.get('with_original_language') || '';
  const primary_release_year = searchParams.get('primary_release_year') || '';

  try {
    let endpoint = 'discover/movie';
    const now = new Date();
    let startDate = new Date();

    if (timeframe === 'week') startDate.setDate(now.getDate() - 7);
    else if (timeframe === 'month') startDate.setMonth(now.getMonth() - 1);
    else if (timeframe === '3months') startDate.setMonth(now.getMonth() - 3);
    else if (timeframe === 'year') startDate.setFullYear(now.getFullYear() - 1);
    else startDate.setDate(now.getDate() - 30); // 30 days default

    const dateStr = startDate.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    // TMDB Discover parameters
    const params = new URLSearchParams({
      api_key: process.env.TMDB_API_KEY as string,
      sort_by: sortBy,
      page: page,
      with_genres: with_genres,
      with_original_language: with_original_language,
      primary_release_year: primary_release_year
    });

    // Apply Real-World Category Filters
    if (category === 'streaming') {
      params.set('watch_region', 'IN');
      params.set('with_watch_monetization_types', 'flatrate');
    } else if (category === 'rent') {
      params.set('watch_region', 'IN');
      params.set('with_watch_monetization_types', 'rent|buy');
    } else if (category === 'theater') {
      params.set('with_release_type', '3'); // Theatrical release
      params.set('primary_release_date.gte', startDate.toISOString().split('T')[0]);
      params.set('primary_release_date.lte', today);
    } else if (category === 'tv') {
      params.set('with_release_type', '4|5'); // TV / Premiere
    } else {
      // Popular / Regional / Default
      // If a year, language, or genre is selected, we want a global scan, not just recent releases
      const isDeepSearch = primary_release_year || with_original_language || with_genres || language;
      
      if (!isDeepSearch) {
        params.set('primary_release_date.gte', dateStr);
      }
      
      if (language && !with_original_language) {
        params.set('with_original_languages', language);
      }
      
      const currentYear = new Date().getFullYear();
      const targetYear = parseInt(primary_release_year);
      
      if (!targetYear || targetYear < currentYear) {
        params.set('vote_count.gte', '20'); // Only apply for past/current hits
      }
    }

    if (language) {
      params.set('with_original_languages', language);
    }

    if (region) {
      params.set('region', region);
      params.set('with_origin_country', region);
    }

    const res = await fetch(`https://api.themoviedb.org/3/${endpoint}?${params.toString()}`);
    const data = await res.json();
    const movies = data.results || [];

    // ENHANCEMENT: Fetch providers for top 12 movies in parallel for the discovery grid
    const moviesWithProviders = await Promise.all(
      movies.slice(0, 12).map(async (movie) => {
        try {
          const providerRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/watch/providers?api_key=${process.env.TMDB_API_KEY}`);
          const providerData = await providerRes.json();
          return {
            ...movie,
            watch_providers: providerData.results?.IN || null
          };
        } catch (e) {
          return movie;
        }
      })
    );

    return NextResponse.json(moviesWithProviders);
  } catch (err) {
    console.error(err);
    return NextResponse.json([], { status: 500 });
  }
}
