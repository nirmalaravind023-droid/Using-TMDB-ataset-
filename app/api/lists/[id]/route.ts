import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const listId = params.id;

  try {
    // 1. Fetch list details
    const listDetails = await query(`
      SELECT l.*, up.username
      FROM lists l
      JOIN user_profiles up ON l.profile_id = up.profile_id
      WHERE l.list_id = $1
    `, [listId]);

    if (listDetails.rowCount === 0) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // 2. Fetch list items (movies)
    const listItems = await query(`
      SELECT li.*, m.title, m.poster_path, m.vote_average, m.release_date
      FROM list_items li
      JOIN movies m ON li.movie_id = m.movie_id
      WHERE li.list_id = $1
      ORDER BY li.added_at ASC
    `, [listId]);

    // 3. Fetch list comments
    const listComments = await query(`
      SELECT lc.*, up.username
      FROM list_comments lc
      JOIN user_profiles up ON lc.profile_id = up.profile_id
      WHERE lc.list_id = $1
      ORDER BY lc.created_at ASC
    `, [listId]);

    return NextResponse.json({
      ...listDetails.rows[0],
      movies: listItems.rows,
      comments: listComments.rows
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
