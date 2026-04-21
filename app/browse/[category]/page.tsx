'use client';

import { useState, useEffect, useRef } from 'react';
import { Star, ArrowLeft, Filter, Loader2, ChevronDown, Check, Globe, Calendar, Zap, Play } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const GENRES = [
  { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' }, { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' }, { id: 14, name: 'Fantasy' }, { id: 27, name: 'Horror' },
  { id: 10749, name: 'Romance' }, { id: 878, name: 'Sci-Fi' }, { id: 53, name: 'Thriller' }
];

const LANGUAGES = [
  { code: 'en', name: 'English' }, { code: 'hi', name: 'Hindi' }, { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' }, { code: 'kn', name: 'Kannada' }, { code: 'ml', name: 'Malayalam' }
];

const YEARS = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i);

export default function BrowsePage({ params }) {
  const router = useRouter();
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Filters
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLang, setSelectedLang] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    fetchMovies(1, true);
  }, [sortBy, selectedGenre, selectedLang, selectedYear, params.category]);

  const fetchMovies = async (pageNum, isNew = false) => {
    if (isNew) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const url = new URL('/api/movies/browse', window.location.origin);
      url.searchParams.set('category', params.category);
      url.searchParams.set('sortBy', sortBy);
      url.searchParams.set('page', pageNum.toString());
      if (selectedGenre) url.searchParams.set('with_genres', selectedGenre);
      if (selectedLang) url.searchParams.set('with_original_language', selectedLang);
      if (selectedYear) url.searchParams.set('primary_release_year', selectedYear);

      const res = await fetch(url.toString());
      const data = await res.json();
      
      if (isNew) {
        setMovies(data);
      } else {
        setMovies(prev => [...prev, ...data]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMovies(nextPage);
  };

  const getTitle = () => {
    const titles = { popular: 'Global Popularity', streaming: 'Digital Premieres', theater: 'In Theaters Now', regional: 'Regional Cinema' };
    return titles[params.category] || 'Neural Discovery';
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 transition-colors duration-300 pb-20 font-sans text-gray-900 dark:text-gray-100 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest mb-12 hover:translate-x-[-4px] transition-transform">
          <ArrowLeft size={16} /> Back to discover
        </Link>

        {/* Dynamic Header & Filter Trigger */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">Discovery Engine Active</span>
            </div>
            <h1 className="text-[48px] md:text-[64px] font-black tracking-tighter leading-none mb-4">{getTitle()}</h1>
            <p className="text-gray-500 max-w-xl text-lg font-medium">Scanning the global cinematic database for titles matching your neural profile.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest transition-all ${isFilterOpen ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg'}`}
            >
              <Filter size={18} /> {isFilterOpen ? 'Close Filters' : 'Fine-Tune Intel'}
            </button>
            <div className="flex items-center gap-1 bg-white dark:bg-gray-800 p-1 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
               {['popularity.desc', 'vote_average.desc'].map(s => (
                 <button 
                  key={s} 
                  onClick={() => setSortBy(s)}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === s ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-indigo-600'}`}
                 >
                   {s.includes('pop') ? 'Popular' : 'Top Rated'}
                 </button>
               ))}
            </div>
          </div>
        </div>

        {/* Expanded Filtering System */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-16"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-white dark:bg-gray-800 p-10 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-2xl">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6 flex items-center gap-2"><Zap size={14} className="text-indigo-600"/> Atmospheric Genre</h4>
                  <div className="flex flex-wrap gap-2">
                    {GENRES.map(g => (
                      <button key={g.id} onClick={() => setSelectedGenre(selectedGenre == g.id ? '' : g.id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedGenre == g.id ? 'bg-indigo-600 text-white' : 'bg-gray-50 dark:bg-gray-900/50 hover:bg-indigo-50'}`}>{g.name}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6 flex items-center gap-2"><Globe size={14} className="text-indigo-600"/> Neural Language</h4>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map(l => (
                      <button key={l.code} onClick={() => setSelectedLang(selectedLang == l.code ? '' : l.code)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedLang == l.code ? 'bg-indigo-600 text-white' : 'bg-gray-50 dark:bg-gray-900/50 hover:bg-indigo-50'}`}>{l.name}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6 flex items-center gap-2"><Calendar size={14} className="text-indigo-600"/> Temporal Year</h4>
                  <div className="flex flex-wrap gap-2">
                    {YEARS.map(y => (
                      <button key={y} onClick={() => setSelectedYear(selectedYear == y ? '' : y)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedYear == y ? 'bg-indigo-600 text-white' : 'bg-gray-50 dark:bg-gray-900/50 hover:bg-indigo-50'}`}>{y}</button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Discovery Grid */}
        {loading ? (
          <div className="py-40 flex flex-col items-center justify-center gap-6">
            <div className="relative w-20 h-20">
              <Loader2 className="animate-spin text-indigo-600 absolute inset-0" size={80} />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-4 h-4 bg-indigo-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            <span className="text-xs font-black uppercase tracking-[0.4em] text-gray-400">Synchronizing Global Database...</span>
          </div>
        ) : movies.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-40 flex flex-col items-center text-center max-w-lg mx-auto"
          >
             <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-[35px] flex items-center justify-center text-gray-300 dark:text-gray-600 mb-10 border border-gray-100 dark:border-gray-700 shadow-inner">
                <Zap size={48} strokeWidth={1} />
             </div>
             <h3 className="text-3xl font-black mb-4 tracking-tighter">Neural Signal Terminated.</h3>
             <p className="text-gray-500 dark:text-gray-400 text-lg font-medium leading-relaxed mb-10">
               Our scanning engine returned zero matches for this specific coordinate matrix. Try expanding your temporal window or genre spectrum.
             </p>
             <button 
              onClick={() => { setSelectedGenre(''); setSelectedLang(''); setSelectedYear(''); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all hover:scale-105"
             >
               Reset Intelligence Matrix
             </button>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-10">

              {movies.map((movie, index) => (
                <motion.div
                  key={`${movie.id}-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (index % 10) * 0.05 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="group"
                >
                  <Link href={`/movie/${movie.id}`} className="block">
                    <div className="relative aspect-[2/3] rounded-[40px] overflow-hidden bg-gray-900 shadow-md group-hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-800 ring-1 ring-black/5 mb-6">
                      <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000" alt={movie.title} />
                      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-2xl flex items-center gap-2 border border-white/10">
                        <Star size={12} className="text-yellow-400" fill="currentColor" />
                        <span className="text-[10px] font-black text-white">{Number(movie.vote_average || 0).toFixed(1)}</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                         <div className="flex items-center gap-2 mb-3">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                            <span className="text-[8px] font-black uppercase text-indigo-400 tracking-widest">Discovery Intel</span>
                         </div>
                         <button className="w-full bg-white text-black py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2">Analyze Title <Play size={10} fill="currentColor" /></button>
                      </div>
                    </div>
                    <h3 className="font-black text-gray-900 dark:text-white text-lg truncate px-2 group-hover:text-indigo-600 transition-colors mb-1">{movie.title}</h3>
                    <div className="flex items-center gap-3 px-2">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{movie.release_date?.split('-')[0]}</span>
                       <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                       <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">Digital Node</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* High-Fidelity Infinity Discovery Button */}
            <div className="mt-24 text-center">
               <motion.button 
                onClick={loadMore} 
                disabled={loadingMore}
                whileHover={{ scale: 1.05 }}
                whileActive={{ scale: 0.95 }}
                className="group relative px-12 py-6 bg-white dark:bg-gray-800 rounded-[30px] border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-indigo-600 transition-all shadow-xl flex flex-col items-center gap-2 mx-auto"
               >
                  {loadingMore ? (
                    <div className="flex items-center gap-3">
                       <Loader2 className="animate-spin text-indigo-600" size={20} />
                       <span className="text-xs font-black uppercase tracking-[0.4em] text-indigo-600">Expanding Neural Search...</span>
                    </div>
                  ) : (
                    <>
                       <div className="text-xs font-black uppercase tracking-[0.5em] text-gray-400 group-hover:text-indigo-600 transition-colors">Expand Discovery Horizon</div>
                       <div className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Syncing Next Discovery Page</div>
                       <ChevronDown size={20} className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-y-1 transition-all mt-2" />
                    </>
                  )}
               </motion.button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
