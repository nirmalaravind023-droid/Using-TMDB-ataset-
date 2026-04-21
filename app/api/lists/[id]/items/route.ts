import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const listId = params.id;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { movieId } = await request.json();

  try {
    // 1. Verify list ownership
    const listCheck = await query(`
      SELECT l.list_id 
      FROM lists l
      JOIN user_profiles up ON l.profile_id = up.profile_id
      WHERE l.list_id = $1 AND up.keycloak_sub = $2
    `, [listId, session.user.id]);

    if (listCheck.rowCount === 0) {
      return NextResponse.json({ error: "Unauthorized or List not found" }, { status: 403 });
    }

    // 2. Ensure movie exists (Lazy Ingestion if needed)
    const movieCheck = await query('SELECT movie_id FROM movies WHERE movie_id = $1', [movieId]);
    if (movieCheck.rowCount === 0) {
        const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.TMDB_API_KEY}`);
        if (tmdbRes.ok) {
          const tmdbMovie = await tmdbRes.json();
          await query(
            `INSERT INTO movies (movie_id, title, overview, release_date, poster_path, vote_average)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (movie_id) DO NOTHING`,
            [movieId, tmdbMovie.title, tmdbMovie.overview, tmdbMovie.release_date || null, tmdbMovie.poster_path, tmdbMovie.vote_average]
          );
        }
    }

    // 3. Add to list
    await query(
      `INSERT INTO list_items (list_id, movie_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [listId, movieId]
    );

    return NextResponse.json({ message: "Movie added to list" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
