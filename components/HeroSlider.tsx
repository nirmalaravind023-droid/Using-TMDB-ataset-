'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Play, Info, ChevronLeft, ChevronRight, Calendar, Globe } from 'lucide-react';
import Link from 'next/link';

export default function HeroSlider() {
  const [movies, setMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/movies/trending')
      .then(res => res.json())
      .then(data => {
        setMovies(data.slice(0, 5));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (movies.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [movies]);

  if (loading) return (
    <div className="w-full h-[70vh] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-[50px] mb-20" />
  );

  if (movies.length === 0) return null;

  const movie = movies[currentIndex];

  return (
    <div className="relative w-full h-[68vh] mb-24 group overflow-hidden rounded-[60px] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.6)] ring-1 ring-white/10 mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={movie.id || movie.movie_id || movie.tmdb_id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img 
            src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`} 
            className="w-full h-full object-cover"
            alt={movie.title}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 z-20 flex items-center px-12 md:px-24">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="max-w-2xl text-white"
        >
          <div className="flex items-center gap-4 mb-6">
             <div className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/40">Trending Now</div>
             <div className="flex items-center gap-2 text-indigo-200">
                <Globe size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Neural Global Discovery</span>
             </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-[0.9] drop-shadow-2xl">
             {movie.title}
          </h1>

          <div className="flex items-center gap-8 mb-8">
             <div className="flex items-center gap-2">
                <Star size={24} className="text-yellow-400" fill="currentColor" />
                <span className="text-2xl font-black">{Number(movie.vote_average || movie.average_rating || 8.5).toFixed(1)}</span>
                <span className="text-white/40 font-bold">/ 10</span>
             </div>
             <div className="w-px h-6 bg-white/20"></div>
             <div className="flex items-center gap-2 text-white/60 font-bold uppercase tracking-widest text-xs">
                <Calendar size={16} />
                {new Date(movie.release_date).getFullYear()}
             </div>
          </div>

          <p className="text-lg text-white/70 leading-relaxed mb-10 line-clamp-3 max-w-xl font-medium">
             {movie.overview}
          </p>

          <div className="flex items-center gap-6">
             <Link href={`/movie/${movie.id || movie.movie_id || movie.tmdb_id}`} className="bg-white text-black px-12 py-5 rounded-full font-black flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-white/10">
                <Play size={20} fill="currentColor" /> Discovery Path
             </Link>
             <Link href={`/movie/${movie.id || movie.movie_id || movie.tmdb_id}`} className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-10 py-5 rounded-full font-black flex items-center gap-3 hover:bg-white/20 transition-all">
                <Info size={20} /> Intel Scan
             </Link>
          </div>
        </motion.div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-12 right-12 z-30 flex gap-4">
         <button onClick={() => setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length)} className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all">
            <ChevronLeft size={24} />
         </button>
         <button onClick={() => setCurrentIndex((prev) => (prev + 1) % movies.length)} className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all">
            <ChevronRight size={24} />
         </button>
      </div>

      {/* Progress Dots */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex gap-3">
         {movies.map((_, i) => (
           <button 
             key={i} 
             onClick={() => setCurrentIndex(i)}
             className={`h-1.5 rounded-full transition-all duration-500 ${i === currentIndex ? 'w-10 bg-indigo-600' : 'w-2 bg-white/30'}`}
           />
         ))}
      </div>
    </div>
  );
}
