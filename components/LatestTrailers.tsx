'use client';

import { useState, useEffect } from 'react';
import { Play, Calendar, Globe, Star, Zap, Monitor, Tv, ShoppingBag, Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function LatestTrailers({ detectedLang }) {
  const [activeTab, setActiveTab] = useState('streaming');
  const [trailers, setTrailers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState(null);
  const [modalCast, setModalCast] = useState([]);

  const openTrailer = async (movie) => {
     setModalCast([]); // Reset cast
     
     // Fetch movie details + credits
     try {
        const [movieRes, creditsRes] = await Promise.all([
           fetch(`/api/movies/${movie.id}`),
           fetch(`/api/movies/${movie.id}/credits`)
        ]);
        const movieData = await movieRes.json();
        const creditsData = await creditsRes.json();
        
        setSelectedTrailer({ ...movie, ...movieData });
        setModalCast(creditsData.cast?.slice(0, 8) || []);
     } catch (e) {
        console.error("Failed to fetch full intel:", e);
        setSelectedTrailer(movie);
     }
  };

  const tabs = [
    { id: 'popular', label: 'Popular', icon: <Zap size={14} /> },
    { id: 'streaming', label: 'Streaming', icon: <Monitor size={14} /> },
    { id: 'regional', label: 'Regional (South India) 📍', icon: <Globe size={14} /> },
    { id: 'tv', label: 'On TV', icon: <Tv size={14} /> },
    { id: 'rent', label: 'For Rent', icon: <ShoppingBag size={14} /> },
    { id: 'theater', label: 'In Theaters', icon: <Ticket size={14} /> }
  ];

  useEffect(() => {
    const fetchTrailers = async () => {
      setLoading(true);
      try {
        let langParam = '';
        if (activeTab === 'regional') {
           const savedLang = detectedLang || localStorage.getItem('detected_lang') || 'kn|ta|te|ml';
           langParam = `&language=${savedLang}&region=IN`;
        }
        const res = await fetch(`/api/movies/browse?category=${activeTab}${langParam}&timeframe=week`);
        const data = await res.json();
        setTrailers(data.length > 0 ? data.slice(0, 10) : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTrailers();
  }, [activeTab, detectedLang]);

  return (
    <section className="py-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
        <div>
           <h2 className="text-5xl font-black tracking-tighter mb-4">Latest Trailers</h2>
           <div className="flex flex-wrap gap-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-100 dark:border-gray-700 hover:border-indigo-600'}`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
         <AnimatePresence mode="wait">
            {loading ? (
              [...Array(8)].map((_, i) => (
                <div key={i} className="aspect-video rounded-[40px] bg-gray-100 dark:bg-gray-800 animate-pulse" />
              ))
            ) : (
              [...trailers, ...trailers, ...trailers].slice(0, 12).map((movie, i) => (
                <motion.div
                  key={`${movie.id}-${i}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.8, ease: "easeOut" }}
                  whileHover={{ scale: 1.15, zIndex: 50 }}
                  className="group relative aspect-video rounded-[45px] overflow-hidden bg-gray-900 shadow-2xl ring-1 ring-white/10 hover:ring-indigo-500 hover:shadow-[0_20px_80px_rgba(79,70,229,0.5)] transition-all duration-500 cursor-pointer"
                >
                  {/* Neural Glow Ambient Layer */}
                  <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 blur-2xl scale-125" />

                  <motion.div
                    animate={{ 
                       scale: [1.1, 1.15, 1.1],
                       x: ["-2%", "2%", "-2%"],
                       y: ["-1%", "1%", "-1%"]
                    }}
                    transition={{ 
                       duration: 20, 
                       repeat: Infinity, 
                       ease: "easeInOut" 
                    }}
                    className="absolute inset-0 z-10 opacity-60 group-hover:opacity-90 transition-opacity duration-1000 bg-cover bg-center"
                    style={{ 
                       backgroundImage: `url(https://image.tmdb.org/t/p/w780${movie.backdrop_path || movie.poster_path})`,
                       width: '110%',
                       height: '110%',
                       left: '-5%',
                       top: '-5%'
                    }}
                  />

                  {/* Holographic Neural Overlay */}
                  <div className="absolute inset-0 z-20 opacity-10 group-hover:opacity-30 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none" />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-8 flex flex-col justify-end z-30">
                    <div className="flex items-center justify-between mb-4">
                       <div className="px-4 py-1.5 bg-indigo-600/20 backdrop-blur-2xl border border-indigo-500/30 rounded-full flex items-center gap-2">
                          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse shadow-[0_0_15px_#818cf8]"></div>
                          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400">Neural Discovery</span>
                       </div>
                       
                       {/* Universal Availability Badge */}
                       {movie.watch_providers?.flatrate?.[0] && (
                         <div className="group/provider relative flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/20 transition-all">
                            <img 
                              src={`https://image.tmdb.org/t/p/original${movie.watch_providers.flatrate[0].logo_path}`} 
                              className="w-4 h-4 rounded-md shadow-sm" 
                              alt="Provider"
                            />
                            <span className="text-[8px] font-black uppercase text-white tracking-widest hidden group-hover/provider:block">
                               {(movie.watch_providers.flatrate[0].provider_name.includes('Hotstar') || movie.watch_providers.flatrate[0].provider_name.includes('Jio')) ? 'JioHotstar' : 'Stream Live'}
                            </span>
                         </div>
                       )}
                    </div>
                    <h3 className="text-white font-black text-2xl mb-3 line-clamp-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-indigo-300 transition-all duration-700">{movie.title}</h3>
                    <div className="flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-8 group-hover:translate-y-0">
                       <button 
                        onClick={() => openTrailer(movie)}
                        className="flex items-center gap-4 bg-white text-black px-8 py-3.5 rounded-[20px] text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                       >
                          <Play size={14} fill="currentColor" /> Play Discovery
                       </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
         </AnimatePresence>
      </div>

      {/* Cinematic Trailer Modal */}
      {/* Cinematic Detailed Discovery Modal */}
      <AnimatePresence>
         {selectedTrailer && (
           <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 lg:p-20">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedTrailer(null)}
                className="absolute inset-0 bg-black/98 backdrop-blur-3xl"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 50 }}
                className="relative w-full max-w-7xl bg-gray-900 rounded-[50px] overflow-hidden shadow-[0_0_150px_rgba(79,70,229,0.2)] border border-white/5 flex flex-col lg:flex-row h-full max-h-[85vh]"
              >
                 {/* Video Playback Side */}
                 <div className="flex-[1.5] bg-black relative">
                    {selectedTrailer.trailer_key ? (
                      <iframe 
                       src={`https://www.youtube.com/embed/${selectedTrailer.trailer_key}?autoplay=1&modestbranding=1&rel=0`}
                       className="w-full h-full"
                       allow="autoplay; encrypted-media"
                       allowFullScreen
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-12">
                         <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center text-3xl mb-6">🎞️</div>
                         <h3 className="text-white font-black text-xl mb-4 uppercase tracking-widest">Trailer Deep-Sync Failed</h3>
                         <p className="text-gray-500 text-sm max-w-xs leading-relaxed">Our neural engine couldn't establish a direct 4K video link. Proceed to the full discovery page for alternate clips and community media.</p>
                      </div>
                    )}
                 </div>

                 {/* Detailed Intelligence Side */}
                 <div className="flex-1 bg-gray-900/50 backdrop-blur-md flex flex-col h-full overflow-hidden border-l border-white/5">
                    {/* Fixed Header */}
                    <div className="p-8 md:p-12 pb-0">
                       <div className="flex items-center gap-3 mb-6">
                          <div className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-[8px] font-black uppercase text-indigo-400 tracking-[0.2em] shadow-[0_0_15px_rgba(99,102,241,0.2)]">Discovery Node</div>
                          <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-[8px] font-black uppercase text-green-400 tracking-[0.2em]">Verified Data</div>
                       </div>
                       <h2 className="text-white font-black text-4xl mb-4 leading-tight tracking-tighter drop-shadow-2xl">{selectedTrailer.title}</h2>
                       <div className="flex items-center gap-6 mb-8 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          <span className="flex items-center gap-2"><Calendar size={12} className="text-indigo-500" /> {selectedTrailer.release_date || 'TBA'}</span>
                          <span className="flex items-center gap-2 text-yellow-500"><Star size={12} fill="currentColor" /> {selectedTrailer.vote_average || selectedTrailer.average_rating || '8.5'} Rating</span>
                       </div>
                       <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent mb-8" />
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto no-scrollbar p-8 md:p-12 pt-0">
                       <h4 className="text-gray-500 font-black text-[10px] uppercase tracking-[0.3em] mb-4">Brief Discovery</h4>
                       <p className="text-gray-300 text-base leading-relaxed mb-10 font-medium">
                          {selectedTrailer.overview || "Deep-scanning movie metadata... No detailed synopsis available in the local cache."}
                       </p>
                       
                       <div className="grid grid-cols-2 gap-4 mb-10">
                          <div className="p-5 bg-white/5 rounded-[25px] border border-white/5 hover:border-white/10 transition-colors">
                             <div className="text-[8px] font-black text-gray-500 uppercase mb-2 tracking-widest">Visual Fidelity</div>
                             <div className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Monitor size={12} className="text-indigo-400" /> 4K Dolby Vision
                             </div>
                          </div>
                          <div className="p-5 bg-white/5 rounded-[25px] border border-white/5 hover:border-white/10 transition-colors">
                             <div className="text-[8px] font-black text-gray-500 uppercase mb-2 tracking-widest">Source Node</div>
                             <div className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Globe size={12} className="text-green-400" /> TMDB-Global
                             </div>
                          </div>
                       </div>

                       {/* Cast Intel Mini-Section */}
                       {modalCast.length > 0 && (
                         <div className="mb-10">
                            <h4 className="text-gray-500 font-black text-[10px] uppercase tracking-[0.3em] mb-6">Key Discovery Nodes (Cast)</h4>
                            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                               {modalCast.map((person) => (
                                 <div key={person.id} className="shrink-0 text-center group/cast">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden mb-3 border border-white/10 group-hover/cast:border-indigo-500 transition-colors shadow-lg">
                                       <img 
                                          src={person.profile_path ? `https://image.tmdb.org/t/p/w185${person.profile_path}` : 'https://via.placeholder.com/185'} 
                                          className="w-full h-full object-cover grayscale group-hover/cast:grayscale-0 transition-all duration-500"
                                          alt={person.name}
                                       />
                                    </div>
                                    <div className="text-[8px] font-black text-white truncate w-16 mb-0.5">{person.name.split(' ')[0]}</div>
                                    <div className="text-[6px] font-bold text-gray-500 uppercase tracking-tighter truncate w-16">{person.character?.split(' ')[0]}</div>
                                 </div>
                               ))}
                            </div>
                         </div>
                       )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-8 md:p-12 pt-6 bg-gradient-to-t from-gray-900 via-gray-900 to-transparent">
                       <div className="flex flex-col sm:flex-row gap-4">
                          <Link 
                           href={`/movie/${selectedTrailer.id || selectedTrailer.movie_id}`}
                           className="flex-2 bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-[25px] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/30 transition-all text-center"
                          >
                             View Full Discovery
                          </Link>
                          <button 
                           onClick={() => setSelectedTrailer(null)}
                           className="flex-1 bg-white/5 hover:bg-white/10 text-white py-5 rounded-[25px] text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/5"
                          >
                             Close Intel
                          </button>
                       </div>
                    </div>
                 </div>

                 {/* Close Trigger */}
                 <button 
                  onClick={() => setSelectedTrailer(null)}
                  className="absolute top-8 right-8 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all hover:rotate-90 z-50 lg:hidden"
                 >
                    <div className="rotate-45 text-2xl">+</div>
                 </button>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </section>
  );
}
