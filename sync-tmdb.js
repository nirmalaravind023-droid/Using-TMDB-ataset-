const axios = require('axios');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'keycloak',
  host: 'localhost',
  database: 'moviedb',
  password: 'password',
  port: 5432,
});

const TMDB_API_KEY = 'af7ed9bd13fa64796bef39ba96999dad';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// ---------------------------------------------------------
// 🚀 The 50 RPS Rate Limiter Engine
// ---------------------------------------------------------
class RateLimiter {
  constructor(requestsPerSecond) {
    this.queue = [];
    this.inFlight = 0;
    this.maxInFlight = requestsPerSecond;
    
    // Process the queue every 1000ms (1 second)
    setInterval(() => this.processQueue(), 1000);
  }

  async processQueue() {
    // Release exactly the allowed number of requests per second
    const batch = this.queue.splice(0, this.maxInFlight);
    this.inFlight += batch.length;
    
    batch.forEach(task => task());
  }

  add(promiseFn) {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await promiseFn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.inFlight--;
        }
      });
    });
  }
}

// Set to 45 to be safe (TMDB limit is 50)
const limiter = new RateLimiter(45); 

// Safe fetch wrapper
const fetchTMDB = (endpoint) => {
  return limiter.add(() => axios.get(`${TMDB_BASE_URL}${endpoint}&api_key=${TMDB_API_KEY}`));
};

// ---------------------------------------------------------
// 🛠️ The Data Ingestion Pipeline
// ---------------------------------------------------------
async function processMovie(movieId, client) {
  try {
    // 1. Fetch Main Details + Videos + Credits all in one optimized call!
    const res = await fetchTMDB(`/movie/${movieId}?append_to_response=videos,credits`);
    const movie = res.data;

    // 2. Insert Movie (Aligned with init.sql schema order)
    await client.query(
      `INSERT INTO movies (tmdb_id, title, release_date, runtime, overview, poster_path, backdrop_path, popularity, average_rating, vote_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (tmdb_id) DO UPDATE SET
         title = EXCLUDED.title,
         overview = EXCLUDED.overview,
         release_date = EXCLUDED.release_date,
         poster_path = EXCLUDED.poster_path,
         backdrop_path = EXCLUDED.backdrop_path,
         popularity = EXCLUDED.popularity,
         average_rating = EXCLUDED.average_rating`,
      [
        movie.id, 
        movie.title, 
        movie.release_date || null, 
        movie.runtime || 0, 
        movie.overview, 
        movie.poster_path, 
        movie.backdrop_path, 
        movie.popularity,
        movie.vote_average,
        movie.vote_count
      ]
    );

    // 3. Insert YouTube Trailers
    if (movie.videos && movie.videos.results) {
      for (const video of movie.videos.results) {
        if (video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')) {
          await client.query(
            `INSERT INTO movie_videos (movie_id, youtube_key, name, type)
             VALUES ((SELECT movie_id FROM movies WHERE tmdb_id = $1), $2, $3, $4)`,
            [movie.id, video.key, video.name, video.type]
          );
        }
      }
    }

    // 4. Insert Top 5 Actors
    if (movie.credits && movie.credits.cast) {
      const topActors = movie.credits.cast.slice(0, 5);
      for (const actor of topActors) {
        // Insert Person
        await client.query(
           `INSERT INTO persons (tmdb_person_id, name, profile_path) 
            VALUES ($1, $2, $3) ON CONFLICT (tmdb_person_id) DO NOTHING`,
           [actor.id, actor.name, actor.profile_path]
        );
        // Link Person to Movie
        await client.query(
           `INSERT INTO movie_cast (movie_id, person_id, character_name, role_type)
            VALUES (
              (SELECT movie_id FROM movies WHERE tmdb_id = $1),
              (SELECT person_id FROM persons WHERE tmdb_person_id = $2),
              $3, 'Actor'
            ) ON CONFLICT DO NOTHING`,
           [movie.id, actor.id, actor.character]
        );
      }
    }

    console.log(`✅ Synced: ${movie.title} (with trailers & cast)`);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log(`⏭️ Skipped TMDB ID ${movieId} (Not Found)`);
    } else {
      console.error(`❌ Failed TMDB ID ${movieId}:`, error.message);
    }
  }
}

// ---------------------------------------------------------
// 🚦 The Execution Engine
// ---------------------------------------------------------
async function startPipeline() {
  const client = await pool.connect();
  
  console.log('🚀 Starting Rate-Limited TMDB Pipeline (45 Requests/sec)...');
  
  // Example: Scraping IDs from 1 to 10,000
  // Because of the RateLimiter, this loop will queue instantly,
  // but the network requests will trickle out at exactly 45 per second!
  for (let i = 1; i <= 100; i++) { // Starting with 100 for testing
    processMovie(i, client);
  }
}

startPipeline();
