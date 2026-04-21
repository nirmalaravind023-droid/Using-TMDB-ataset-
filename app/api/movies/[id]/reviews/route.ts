import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request, { params }) {
  try {
    // Fetch all public reviews for this movie, joined with the user's profile info
    const reviews = await query(`
      SELECT mi.interaction_id, mi.rating, mi.review_text, mi.interaction_type, mi.created_at, up.username, up.avatar_url
      FROM movie_interactions mi
      JOIN user_profiles up ON mi.profile_id = up.profile_id
      WHERE mi.movie_id = $1 AND mi.is_public = TRUE
      ORDER BY mi.created_at DESC
    `, [params.id]);
    
    return NextResponse.json(reviews.rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
