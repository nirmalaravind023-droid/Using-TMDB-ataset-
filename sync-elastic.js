require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const db = new Client({
  user: process.env.DB_USER ?? 'keycloak',
  host: process.env.DB_HOST ?? 'localhost',
  database: process.env.DB_NAME ?? 'moviedb',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
});

const ELASTIC_URL = process.env.ELASTICSEARCH_URL ?? 'http://localhost:9200';
const INDEX_NAME = 'movies';

async function syncToElasticSearch() {
  console.log("Connecting to PostgreSQL...");
  await db.connect();

  console.log("Fetching movies from database...");
  const res = await db.query('SELECT * FROM movies');
  const movies = res.rows;

  console.log(`Found ${movies.length} movies. Syncing to ElasticSearch...`);

  // Create index (ignore 400 if it already exists)
  const createRes = await fetch(`${ELASTIC_URL}/${INDEX_NAME}`, { method: 'PUT' });
  if (!createRes.ok && createRes.status !== 400) {
    throw new Error(`Failed to create ES index: ${createRes.status}`);
  }

  let indexedCount = 0;
  let failedCount = 0;

  for (const movie of movies) {
    const doc = {
      movie_id: movie.movie_id,
      title: movie.title,
      overview: movie.overview,
      release_date: movie.release_date,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
    };

    try {
      const indexRes = await fetch(`${ELASTIC_URL}/${INDEX_NAME}/_doc/${movie.movie_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });

      if (!indexRes.ok) {
        console.error(`Failed to index movie ${movie.movie_id}: HTTP ${indexRes.status}`);
        failedCount++;
      } else {
        indexedCount++;
      }
    } catch (e) {
      console.error(`Failed to index movie ${movie.movie_id}:`, e.message);
      failedCount++;
    }
  }

  console.log(`✅ Indexed ${indexedCount} movies. ${failedCount > 0 ? `❌ ${failedCount} failed.` : ''}`);
  await db.end();
}

syncToElasticSearch().catch(console.error);
