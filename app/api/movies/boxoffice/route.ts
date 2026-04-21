import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || 'US';

    // Fetches Real-Time Top Box Office / Now Playing based on the user's exact country!
    const res = await fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${process.env.TMDB_API_KEY}&region=${region}`);
    const data = await res.json();
    return NextResponse.json(data.results || []);
  } catch (err) {
    console.error(err);
    return NextResponse.json([], { status: 500 });
  }
}
