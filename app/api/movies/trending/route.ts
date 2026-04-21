import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetches Real-Time Trending Movies for "This Week"
    const res = await fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${process.env.TMDB_API_KEY}`);
    const data = await res.json();
    return NextResponse.json(data.results || []);
  } catch (err) {
    console.error(err);
    return NextResponse.json([], { status: 500 });
  }
}
