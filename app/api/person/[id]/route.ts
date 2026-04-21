import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const personId = params.id;

  try {
    // 1. Fetch Person Details
    const detailsRes = await fetch(`https://api.themoviedb.org/3/person/${personId}?api_key=${process.env.TMDB_API_KEY}`);
    const details = await detailsRes.json();

    // 2. Fetch Person Movie Credits
    const creditsRes = await fetch(`https://api.themoviedb.org/3/person/${personId}/movie_credits?api_key=${process.env.TMDB_API_KEY}`);
    const credits = await creditsRes.json();

    return NextResponse.json({
      ...details,
      movies: credits.cast // Return full list for frontend categorization
    });
  } catch (err) {
    console.error('Person Fetch Error:', err);
    return NextResponse.json({ error: 'Failed to fetch person data' }, { status: 500 });
  }
}
