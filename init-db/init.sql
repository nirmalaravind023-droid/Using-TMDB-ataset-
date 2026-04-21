-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Movie Metadata
CREATE TABLE movies (
    movie_id SERIAL PRIMARY KEY,
    tmdb_id INT UNIQUE,
    title VARCHAR(500) NOT NULL,
    release_date DATE,
    runtime INT,
    overview TEXT,
    poster_path VARCHAR(255),
    backdrop_path VARCHAR(255), -- NEW: Background images
    popularity DECIMAL(10, 3) DEFAULT 0, -- NEW: TMDB Popularity score
    average_rating DECIMAL(3, 2) DEFAULT 0,
    vote_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. People (Actors/Directors)
CREATE TABLE persons (
    person_id SERIAL PRIMARY KEY,
    tmdb_person_id INT UNIQUE,
    name VARCHAR(255) NOT NULL,
    profile_path VARCHAR(255),
    biography TEXT
);

-- 3. Many-to-Many: Movie <-> Cast/Crew
CREATE TABLE movie_cast (
    movie_id INT REFERENCES movies(movie_id) ON DELETE CASCADE,
    person_id INT REFERENCES persons(person_id) ON DELETE CASCADE,
    character_name VARCHAR(255),
    role_type VARCHAR(50), -- "Actor", "Director"
    PRIMARY KEY (movie_id, person_id, role_type)
);

-- 4. Genres
CREATE TABLE genres (
    genre_id SERIAL PRIMARY KEY,
    tmdb_genre_id INT UNIQUE,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE movie_genres (
    movie_id INT REFERENCES movies(movie_id) ON DELETE CASCADE,
    genre_id INT REFERENCES genres(genre_id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, genre_id)
);

-- 5. Trailers & Videos (NEW)
CREATE TABLE movie_videos (
    video_id SERIAL PRIMARY KEY,
    movie_id INT REFERENCES movies(movie_id) ON DELETE CASCADE,
    youtube_key VARCHAR(100) NOT NULL,
    name VARCHAR(255),
    type VARCHAR(50) -- 'Trailer', 'Teaser', 'Featurette'
);

-- 6. User Profiles (Linked to Keycloak)
CREATE TABLE user_profiles (
    profile_id SERIAL PRIMARY KEY,
    keycloak_sub UUID UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Ratings & Reviews
CREATE TABLE movie_interactions (
    interaction_id SERIAL PRIMARY KEY,
    movie_id INT REFERENCES movies(movie_id) ON DELETE CASCADE,
    profile_id INT REFERENCES user_profiles(profile_id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 10),
    review_text TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (movie_id, profile_id)
);

-- Indices for 1M+ scaling
CREATE INDEX idx_movie_title_trgm ON movies USING gin (title gin_trgm_ops);
CREATE INDEX idx_user_ratings ON movie_interactions (profile_id);
CREATE INDEX idx_movie_lookup ON movie_interactions (movie_id);

-- Trigger to automatically update movie average ratings
CREATE OR REPLACE FUNCTION update_movie_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE movies
    SET average_rating = (SELECT AVG(rating) FROM movie_interactions WHERE movie_id = NEW.movie_id),
        vote_count = (SELECT COUNT(*) FROM movie_interactions WHERE movie_id = NEW.movie_id)
    WHERE movie_id = NEW.movie_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rating
AFTER INSERT OR UPDATE ON movie_interactions
FOR EACH ROW EXECUTE FUNCTION update_movie_rating_stats();
