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

  const { commentText, parentId } = await request.json();

  try {
    const userProfile = await query(
      'SELECT profile_id FROM user_profiles WHERE keycloak_sub = $1',
      [session.user.id]
    );

    if (userProfile.rowCount === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profileId = userProfile.rows[0].profile_id;

    const newComment = await query(
      `INSERT INTO list_comments (list_id, profile_id, comment_text, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [listId, profileId, commentText, parentId || null]
    );

    return NextResponse.json(newComment.rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
