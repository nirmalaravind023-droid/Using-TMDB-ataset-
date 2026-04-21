'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Globe, Star, Calendar, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function LocalRecommendations() {
  const [movies, setMovies] = useState([]);
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLocal = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/movies/local');
        const data = await res.json();
        setMovies(data.movies || []);
        setRegion(data.region || 'Global');
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLocal();
  }, []);

  if (movies.length === 0 && !loading) return null;

  return (
    <section className="py-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
           <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-[0.3em] mb-4">
              <Globe size={14} /> Trending in your Region
           </div>
           <h2 className="text-5xl font-black tracking-tighter text-gray-900 dark:text-white">
              Currently playing in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-fuchsia-600">{region}</span>
           </h2>
        </div>
        <Link href={`/browse/popular`} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors group">
           View all releases <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-[30px] bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))
        ) : (
          movies.map((movie, i) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -12 }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
            >
              <Link href={`/movie/${movie.id}`} className="group block">
                <div className="relative aspect-[10/16] rounded-[45px] overflow-hidden bg-gray-200 dark:bg-gray-800 mb-6 shadow-xl group-hover:shadow-[0_30px_60px_-15px_rgba(99,102,241,0.4)] transition-all duration-700 ring-1 ring-black/5">
                  <img 
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    alt={movie.title}
                  />
                  
                  {/* High-Fidelity Intelligence Overlay */}
                  <div className="absolute top-5 left-5 right-5 flex justify-between items-start z-10">
                     <div className="bg-black/40 backdrop-blur-xl border border-white/20 px-4 py-1.5 rounded-2xl flex items-center gap-2 shadow-2xl">
                        <Star size={12} className="text-yellow-400" fill="currentColor" />
                        <span className="text-[10px] font-black text-white">{Number(movie.vote_average || 0).toFixed(1)}</span>
                     </div>
                     <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        Discovery
                     </div>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                     <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <p className="text-white text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Regional Intel</p>
                        <p className="text-white text-xs font-bold leading-relaxed line-clamp-3">{movie.overview}</p>
                     </div>
                  </div>
                </div>
                <div className="px-2">
                   <h3 className="font-black text-gray-900 dark:text-white text-xl truncate mb-1 group-hover:text-indigo-600 transition-colors tracking-tight">{movie.title}</h3>
                   <div className="flex items-center gap-3 text-gray-400 font-bold uppercase tracking-widest text-[9px]">
                      <span className="flex items-center gap-1.5"><Calendar size={12} className="text-indigo-500" /> {new Date(movie.release_date).getFullYear()}</span>
                      <div className="w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                      <span className="text-indigo-600 dark:text-indigo-400">Verified Hit</span>
                   </div>
                </div>
              </Link>
            </motion.div>
          ))

        )}
      </div>
    </section>
  );
}
