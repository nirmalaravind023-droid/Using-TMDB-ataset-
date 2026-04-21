const { Client } = require('pg');


// PostgreSQL Connection
const db = new Client({
  user: 'keycloak',
  host: 'localhost',
  database: 'moviedb',
  password: 'password',
  port: 5432,
});

const ELASTIC_URL = 'http://localhost:9200';
const INDEX_NAME = 'movies';

async function syncToElasticSearch() {
  console.log("Connecting to PostgreSQL...");
  await db.connect();
  
  // 1. Fetch movies from PostgreSQL
  console.log("Fetching movies from database...");
  const res = await db.query('SELECT * FROM movies');
  const movies = res.rows;
  
  console.log(`Found ${movies.length} movies. Syncing to ElasticSearch...`);
  
  // 2. Create ElasticSearch Index
  try {
    await fetch(`${ELASTIC_URL}/${INDEX_NAME}`, { method: 'PUT' });
    console.log("Created ElasticSearch index 'movies'.");
  } catch(e) {
    console.log("Index might already exist.");
  }
  
  // 3. Bulk Indexing
  let indexedCount = 0;
  for (const movie of movies) {
    try {
      const doc = {
        movie_id: movie.movie_id,
        title: movie.title,
        overview: movie.overview,
        release_date: movie.release_date,
        poster_path: movie.poster_path,
        vote_average: movie.vote_average
      };
      
      await fetch(`${ELASTIC_URL}/${INDEX_NAME}/_doc/${movie.movie_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc)
      });
      indexedCount++;
    } catch (e) {
      console.error(`Failed to index movie ${movie.movie_id}`);
    }
  }
  
  console.log(`✅ Successfully indexed ${indexedCount} movies into ElasticSearch!`);
  await db.end();
}

syncToElasticSearch().catch(console.error);
