import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const movieId = searchParams.get('movieId');

  if (!movieId) {
    return NextResponse.json({ error: 'Movie ID required' }, { status: 400 });
  }

  try {
    // Strategy 1: Collaborative Filtering
    // "Users who liked this movie (rated 7+) also liked..."
    const recommendations = await query(`
      SELECT m.movie_id, m.title, m.poster_path, m.average_rating, COUNT(mi2.profile_id) as common_likes
      FROM movie_interactions mi1
      JOIN movie_interactions mi2 ON mi1.profile_id = mi2.profile_id
      JOIN movies m ON mi2.movie_id = m.movie_id
      WHERE mi1.movie_id = $1 
        AND mi1.rating >= 7 
        AND mi2.rating >= 7
        AND mi2.movie_id != $1
      GROUP BY m.movie_id, m.title, m.poster_path, m.average_rating
      ORDER BY common_likes DESC, m.average_rating DESC
      LIMIT 5
    `, [movieId]);

    // If we have enough data to make smart recommendations, return them!
    if (recommendations.rows.length > 0) {
      return NextResponse.json({ type: 'collaborative', movies: recommendations.rows });
    }

    // Strategy 2: TMDB API Fallback
    if (process.env.TMDB_API_KEY) {
      try {
        const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/recommendations?api_key=${process.env.TMDB_API_KEY}`);
        if (tmdbRes.ok) {
          const tmdbData = await tmdbRes.json();
          if (tmdbData.results && tmdbData.results.length > 0) {
             const tmdbMovies = tmdbData.results.slice(0, 5).map(m => ({
               movie_id: m.id,
               title: m.title,
               poster_path: m.poster_path,
               average_rating: m.vote_average
             }));
             return NextResponse.json({ type: 'tmdb', movies: tmdbMovies });
          }
        }
      } catch (e) {
        console.error("TMDB Fallback failed", e);
      }
    }

    // Strategy 3: "Cold Start" Local Fallback
    // If no one has rated this movie yet, just show the global top-rated movies
    const fallback = await query(`
      SELECT movie_id, title, poster_path, average_rating
      FROM movies
      WHERE movie_id != $1
      ORDER BY vote_average DESC NULLS LAST
      LIMIT 5
    `, [movieId]);

    return NextResponse.json({ type: 'fallback', movies: fallback.rows });

  } catch (err) {
    console.error('Recommendation Error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
