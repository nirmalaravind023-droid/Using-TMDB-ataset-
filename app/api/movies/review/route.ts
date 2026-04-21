import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { movieId, rating, reviewText, likeStatus } = await request.json();

  try {
    // 1. Ensure user profile exists (Sync Keycloak user to local DB)
    await query(
      `INSERT INTO user_profiles (keycloak_sub, username, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (keycloak_sub) DO NOTHING`,
      [session.user.id, session.user.name, session.user.email]
    );

    const userProfile = await query(
      'SELECT profile_id FROM user_profiles WHERE keycloak_sub = $1',
      [session.user.id]
    );

    const profileId = userProfile.rows[0].profile_id;

    // 2. Lazy Ingestion: Ensure movie exists in local database
    const movieCheck = await query('SELECT movie_id FROM movies WHERE movie_id = $1', [movieId]);
    if (movieCheck.rowCount === 0) {
      try {
        const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.TMDB_API_KEY}`);
        if (tmdbRes.ok) {
          const tmdbMovie = await tmdbRes.json();
          await query(
            `INSERT INTO movies (movie_id, title, overview, release_date, poster_path, vote_average)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (movie_id) DO NOTHING`,
            [movieId, tmdbMovie.title, tmdbMovie.overview, tmdbMovie.release_date || null, tmdbMovie.poster_path, tmdbMovie.vote_average]
          );
        } else {
          await query(`INSERT INTO movies (movie_id, title) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [movieId, `Movie ${movieId}`]);
        }
      } catch (e) {
        await query(`INSERT INTO movies (movie_id, title) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [movieId, `Movie ${movieId}`]);
      }
    }

    // 3. Insert or Update the review
    await query(
      `INSERT INTO movie_interactions (movie_id, profile_id, rating, review_text, interaction_type, is_public)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       ON CONFLICT (movie_id, profile_id) 
       DO UPDATE SET rating = $3, review_text = $4, interaction_type = $5, is_public = TRUE, updated_at = CURRENT_TIMESTAMP`,
      [movieId, profileId, rating, reviewText, likeStatus || null]
    );

    return NextResponse.json({ message: "Review saved successfully!" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
