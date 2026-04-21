
-- IMDb Historical Data Schema
CREATE TABLE IF NOT EXISTS imdb_basics (
    tconst VARCHAR(20) PRIMARY KEY,
    title_type VARCHAR(50),
    primary_title TEXT,
    original_title TEXT,
    is_adult BOOLEAN,
    start_year INTEGER,
    end_year INTEGER,
    runtime_minutes INTEGER,
    genres TEXT[]
);

CREATE TABLE IF NOT EXISTS imdb_ratings (
    tconst VARCHAR(20) PRIMARY KEY REFERENCES imdb_basics(tconst),
    average_rating DECIMAL(3,1),
    num_votes INTEGER
);

-- Indexing for high-performance discovery
CREATE INDEX IF NOT EXISTS idx_imdb_title ON imdb_basics(primary_title);
CREATE INDEX IF NOT EXISTS idx_imdb_year ON imdb_basics(start_year);
