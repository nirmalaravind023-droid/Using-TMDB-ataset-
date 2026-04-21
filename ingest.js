const { Pool } = require('pg');

const pool = new Pool({
  user: 'keycloak',
  host: 'localhost',
  database: 'moviedb',
  password: 'password',
  port: 5432,
});

const mockMovies = [
  { id: 330459, title: 'Rogue One: A Star Wars Story', overview: 'A rogue band of resistance fighters unite for a mission to steal the Death Star plans.', release_date: '2016-12-14', poster_path: '/vdXGB7oB2A10Awnp5yv0q1PrtvQ.jpg', vote_average: 8.9, vote_count: 14000 },
  { id: 157336, title: 'Interstellar', overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole.', release_date: '2014-11-05', poster_path: '/gEU2QlsUUHXjNPExFqO72124Amd.jpg', vote_average: 8.6, vote_count: 32000 },
  { id: 438631, title: 'Dune', overview: 'Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding...', release_date: '2021-09-15', poster_path: '/d5NXSklXo0qyIYkgV94XAgMIckC.jpg', vote_average: 8.7, vote_count: 8500 },
  { id: 376867, title: 'Moonlight', overview: 'The tender, heartbreaking story of a young man\'s struggle to find himself...', release_date: '2016-10-21', poster_path: '/q0n5v3H9t3135m5sI419dEbqW0I.jpg', vote_average: 9.2, vote_count: 6500 },
  { id: 346698, title: 'Barbie', overview: 'Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land.', release_date: '2023-07-19', poster_path: '/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg', vote_average: 7.2, vote_count: 10000 },
  { id: 872585, title: 'Oppenheimer', overview: 'The story of J. Robert Oppenheimer\'s role in the development of the atomic bomb.', release_date: '2023-07-19', poster_path: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', vote_average: 8.1, vote_count: 9000 },
  { id: 155, title: 'The Dark Knight', overview: 'Batman raises the stakes in his war on crime.', release_date: '2008-07-16', poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', vote_average: 8.5, vote_count: 28000 },
  { id: 27205, title: 'Inception', overview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious...', release_date: '2010-07-15', poster_path: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', vote_average: 8.4, vote_count: 32000 }
];

async function seedMovies() {
  console.log('Seeding mock movies into database...');
  const client = await pool.connect();
  try {
    for (const movie of mockMovies) {
      await client.query(
        `INSERT INTO movies (tmdb_id, title, overview, release_date, poster_path, average_rating, vote_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (tmdb_id) DO NOTHING`,
        [movie.id, movie.title, movie.overview, movie.release_date, movie.poster_path, movie.vote_average, movie.vote_count]
      );
    }
    console.log(`Successfully seeded ${mockMovies.length} movies!`);
  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedMovies();
