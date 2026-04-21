import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, isPublic } = await request.json();

  try {
    const userProfile = await query(
      'SELECT profile_id FROM user_profiles WHERE keycloak_sub = $1',
      [session.user.id]
    );

    if (userProfile.rowCount === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profileId = userProfile.rows[0].profile_id;

    const newList = await query(
      `INSERT INTO lists (profile_id, title, description, is_public)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [profileId, title, description, isPublic !== undefined ? isPublic : true]
    );

    return NextResponse.json(newList.rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const lists = await query(`
      SELECT l.*, up.username, COUNT(li.list_item_id) as movie_count
      FROM lists l
      JOIN user_profiles up ON l.profile_id = up.profile_id
      LEFT JOIN list_items li ON l.list_id = li.list_id
      WHERE l.is_public = TRUE
      GROUP BY l.list_id, up.username
      ORDER BY l.created_at DESC
    `);
    return NextResponse.json(lists.rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
