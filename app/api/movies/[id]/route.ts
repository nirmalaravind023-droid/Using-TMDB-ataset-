import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const movieId = params.id;

  try {
    // 1. Try local database first
    const localMovie = await query('SELECT * FROM movies WHERE movie_id = $1', [movieId]);
    
    if (localMovie.rowCount > 0) {
      return NextResponse.json(localMovie.rows[0]);
    }

    // 2. If not in local DB, fetch from TMDB with append_to_response
    const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.TMDB_API_KEY}&append_to_response=images,videos,watch/providers,release_dates`);
    
    if (tmdbRes.ok) {
      const tmdbMovie = await tmdbRes.json();
      
      const videos = tmdbMovie.videos?.results || [];
      const bestVideo = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') || 
                        videos.find(v => v.type === 'Teaser' && v.site === 'YouTube') || 
                        videos.find(v => v.type === 'Clip' && v.site === 'YouTube') ||
                        videos.find(v => v.site === 'YouTube');

      // Detect Theatrical Status (IN focus)
      const releaseDates = tmdbMovie.release_dates?.results?.find(r => r.iso_3166_1 === 'IN')?.release_dates || [];
      const isTheatrical = releaseDates.some(r => r.type === 3);
      const releaseDate = new Date(tmdbMovie.release_date);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - releaseDate.getTime()) / (1000 * 3600 * 24));
      
      const isInTheaters = isTheatrical && diffDays < 90 && diffDays > -15; // Within a 3-month window or upcoming

      const movieData = {
        movie_id: tmdbMovie.id,
        title: tmdbMovie.title,
        overview: tmdbMovie.overview,
        release_date: tmdbMovie.release_date,
        poster_path: tmdbMovie.poster_path,
        backdrop_path: tmdbMovie.backdrop_path,
        average_rating: tmdbMovie.vote_average,
        vote_count: tmdbMovie.vote_count,
        trailer_key: bestVideo?.key,
        watch_providers: tmdbMovie["watch/providers"]?.results || null,
        is_in_theaters: isInTheaters,
        media: {
          videos: tmdbMovie.videos?.results || [],
          backdrops: tmdbMovie.images?.backdrops?.slice(0, 10) || [],
          posters: tmdbMovie.images?.posters?.slice(0, 10) || []
        }
      };

      return NextResponse.json(movieData);
    }

    return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
  } catch (err) {
    console.error('Movie Fetch Error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
