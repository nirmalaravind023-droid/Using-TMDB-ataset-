import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  try {
    let countryCode = 'US'; // Default

    // 1. Get Country Code from Coordinates or IP
    if (lat && lon) {
      const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
      const geoData = await geoRes.json();
      countryCode = geoData.countryCode || 'US';
    } else {
      const ipRes = await fetch('https://ipapi.co/json/');
      const ipData = await ipRes.json();
      countryCode = ipData.country_code || 'US';
    }

    // 2. Fetch Now Playing movies in that region from TMDB
    const moviesRes = await fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${process.env.TMDB_API_KEY}&region=${countryCode}&language=en-US&page=1`);
    const moviesData = await moviesRes.json();

    return NextResponse.json({
      region: countryCode,
      movies: moviesData.results?.slice(0, 10) || []
    });
  } catch (err) {
    console.error('Local Movies Fetch Error:', err);
    return NextResponse.json({ error: 'Failed to fetch local recommendations' }, { status: 500 });
  }
}
