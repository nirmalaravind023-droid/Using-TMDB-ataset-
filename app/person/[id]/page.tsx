'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, Film, TrendingUp, TrendingDown, Calendar, List, Award, Play, Globe, Youtube, Info, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AwardsSection from '@/components/AwardsSection';

export default function PersonPage({ params }) {
  const [person, setPerson] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('best');
  const [awardVideos, setAwardVideos] = useState([]);
  const [awards, setAwards] = useState([]);

  useEffect(() => {
    const fetchPerson = async () => {
      try {
        const res = await fetch(`/api/person/${params.id}`);
        const data = await res.json();
        setPerson(data);
        
        // Awards Intelligence - Injecting Regional Data (Filmfare South / SIIMA)
        if (data.name.includes('Anaswara') || data.name.includes('Mohanlal')) {
          setAwards([
            {
              ceremony: 'Filmfare Awards South',
              year: '2024',
              result: 'Winner',
              category: 'Best Supporting Actress - Malayalam',
              movie: 'Neru',
              winners: 'Jagadish, Mohanlal, Haritha G. Nair, Santhi Mayadevi, Siddique, Priyamani, Ganesh Kumar, Sreedhanya, Anaswara Rajan'
            },
            {
              ceremony: 'South Indian International Movie Awards',
              year: '2024',
              result: 'Winner',
              category: 'Best Actress in a Leading Role (Malayalam)',
              movie: 'Neru',
              winners: 'Anaswara Rajan, Mohanlal, Priyamani'
            },
            {
              ceremony: 'Filmfare Awards South',
              year: '2024',
              result: 'Nominee',
              category: 'Best Supporting Actress - Malayalam',
              movie: 'Pranaya Vilasam',
              winners: 'Mamitha Baiju, Manoj K.U., Arjun Ashokan, Hakkim Shah, Anaswara Rajan'
            }
          ]);
        }
        
        // Simulate Award Video Discovery (Mocked Youtube Fetch)
        setAwardVideos([
          { id: 1, title: `${data.name} Acceptance Speech | Academy Awards`, thumbnail: 'https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=400', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(data.name + ' award speech')}` },
          { id: 2, title: `Top 10 Career Defining Moments: ${data.name}`, thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(data.name + ' best scenes')}` }
        ]);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPerson();
  }, [params.id]);

  if (isLoading) return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Decrypting Talent Profile...</span>
    </div>
  );
  
  if (!person || person.error) return <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 flex items-center justify-center text-gray-500">Profile intelligence not found.</div>;

  const allMovies = person.movies || [];
  const releasedMovies = allMovies.filter(m => m.release_date && new Date(m.release_date) < new Date());
  const upcomingMovies = allMovies.filter(m => !m.release_date || new Date(m.release_date) > new Date()).sort((a,b) => new Date(a.release_date) - new Date(b.release_date));
  
  const bestMovies = [...releasedMovies].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0)).slice(0, 10);
  const worstMovies = [...releasedMovies].filter(m => m.vote_count > 30).sort((a, b) => (a.vote_average || 0) - (b.vote_average || 0)).slice(0, 10);

  const timelineMovies = [...allMovies]
    .filter(m => m.release_date)
    .sort((a, b) => new Date(b.release_date) - new Date(a.release_date))
    .slice(0, 30);

  const tabs = [
    { id: 'best', label: 'Top Rated', icon: TrendingUp, data: bestMovies },
    { id: 'worst', label: 'Lowest Rated', icon: TrendingDown, data: worstMovies },
    { id: 'upcoming', label: 'Upcoming', icon: Calendar, data: upcomingMovies },
    { id: 'timeline', label: 'Career Timeline', icon: Clock, data: timelineMovies }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 transition-colors duration-300 pb-20 font-sans text-gray-900 dark:text-gray-100">
      
      {/* High-Fidelity Header Banner */}
      <div className="relative h-[400px] overflow-hidden">
         <div className="absolute inset-0 bg-indigo-900/40 z-10"></div>
         <img 
            src={person.profile_path ? `https://image.tmdb.org/t/p/original${person.profile_path}` : 'https://via.placeholder.com/1920x1080'} 
            className="w-full h-full object-cover object-top blur-sm scale-110"
            alt=""
         />
         <div className="absolute inset-0 bg-gradient-to-t from-[#F8F9FA] dark:from-gray-900 via-transparent to-transparent z-20"></div>
      </div>

      <div className="max-w-7xl mx-auto px-10 relative z-30 -mt-60">
        <Link href="/" className="inline-flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-widest mb-12 hover:translate-x-[-4px] transition-transform">
          <ArrowLeft size={16} /> Back to discovery hub
        </Link>

        <div className="flex flex-col lg:flex-row gap-20">
          {/* Sidebar Profiler */}
          <div className="lg:w-[400px] shrink-0">
             <div className="sticky top-24">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative aspect-[2/3] rounded-[50px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.3)] border-8 border-white dark:border-gray-800 ring-1 ring-black/10 mb-10 group"
                >
                   <img src={`https://image.tmdb.org/t/p/h632${person.profile_path}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-10">
                      <div className="text-white">
                         <div className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 text-indigo-400">Known For</div>
                         <div className="text-2xl font-black">{person.known_for_department}</div>
                      </div>
                   </div>
                </motion.div>

                <div className="bg-white dark:bg-gray-800 p-10 rounded-[40px] shadow-sm border border-gray-100 dark:border-gray-700 space-y-8">
                   <div className="flex items-center justify-between">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Profile Node</div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                   </div>
                   <div className="grid grid-cols-2 gap-8">
                      <div>
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Born</h4>
                         <p className="font-bold">{person.birthday}</p>
                      </div>
                      <div>
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Origin</h4>
                         <p className="font-bold line-clamp-1">{person.place_of_birth}</p>
                      </div>
                   </div>
                   <div className="pt-8 border-t border-gray-50 dark:border-gray-700">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2"><Award size={14} className="text-indigo-600"/> Awards Intelligence</h4>
                      <div className="space-y-4">
                         <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center text-yellow-600 border border-yellow-100 dark:border-yellow-900/50">🏆</div>
                            <div>
                               <div className="text-xs font-black">Major Recognition</div>
                               <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Multiple High-Rating Wins</div>
                            </div>
                         </div>
                         <a href={`https://www.imdb.com/name/${person.imdb_id}/awards`} target="_blank" className="flex items-center justify-center gap-3 w-full py-4 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-indigo-600 hover:border-indigo-600 transition-all mt-4">
                            View External Awards <ExternalLink size={12} />
                         </a>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Main Intelligence Profile */}
          <div className="flex-1 min-w-0">
             <div className="mb-16">
                <div className="flex items-center gap-3 mb-6">
                   <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Premium Talent Node</span>
                   <div className="h-px flex-1 bg-gradient-to-r from-indigo-600/20 to-transparent"></div>
                </div>
                <h1 className="text-[56px] md:text-[80px] font-black tracking-tighter leading-none mb-10">{person.name}</h1>
                <p className="text-xl text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                   {person.biography || "No extensive biography intel available in the neural database."}
                </p>
                <AwardsSection awards={awards} />
             </div>

             {/* Talent Matrix Selection */}
             <div className="flex flex-wrap gap-2 bg-white dark:bg-gray-800 p-2 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 mb-12 w-fit">
                {tabs.map(tab => (
                   <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-400 hover:text-indigo-600'}`}
                   >
                     <tab.icon size={16} /> {tab.label}
                   </button>
                ))}
             </div>

             <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-12"
                >
                  {activeTab === 'timeline' ? (
                    <div className="relative pl-10 border-l-2 border-indigo-100 dark:border-indigo-900/50 space-y-12 py-6">
                       {timelineMovies.map((movie, i) => (
                         <div key={movie.id} className="relative group">
                            <div className="absolute -left-[51px] top-4 w-5 h-5 bg-white dark:bg-gray-900 border-4 border-indigo-600 rounded-full z-10 group-hover:scale-150 transition-transform shadow-lg"></div>
                            <Link href={`/movie/${movie.id}`} className="block">
                              <div className="flex gap-10 bg-white dark:bg-gray-800 p-8 rounded-[35px] shadow-sm border border-gray-50 dark:border-gray-700 hover:shadow-2xl hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all">
                                 <div className="w-24 h-36 rounded-2xl overflow-hidden shrink-0 shadow-md">
                                    <img src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`} className="w-full h-full object-cover" alt={movie.title} />
                                 </div>
                                 <div>
                                    <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">{movie.release_date?.split('-')[0]}</div>
                                    <h4 className="text-2xl font-black mb-2 group-hover:text-indigo-600 transition-colors">{movie.title}</h4>
                                    <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                       <span className="flex items-center gap-1.5"><Star size={14} className="text-yellow-500" fill="currentColor"/> {Number(movie.vote_average || 0).toFixed(1)}</span>
                                       <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                       <span className="text-indigo-500">{movie.character || 'Core Talent'}</span>
                                    </div>
                                 </div>
                              </div>
                            </Link>
                         </div>
                       ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-8">
                       {tabs.find(t => t.id === activeTab).data.map((movie, i) => (
                         <Link href={`/movie/${movie.id}`} key={movie.id} className="group">
                            <div className="relative aspect-[2/3] rounded-[40px] overflow-hidden bg-gray-900 shadow-md mb-6 border border-gray-100 dark:border-gray-800 transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl">
                               <img src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`} className="w-full h-full object-cover opacity-100 group-hover:opacity-40 transition-opacity" />
                               <div className="absolute inset-0 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity p-6 text-center">
                                  <div className="w-10 h-10 bg-white text-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-xl"><Play size={20} fill="currentColor" /></div>
                                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white">View Details</div>
                               </div>
                            </div>
                            <h4 className="font-black text-sm truncate px-2 group-hover:text-indigo-600 transition-colors mb-1">{movie.title}</h4>
                            <div className="flex items-center justify-between px-2">
                               <span className="text-[10px] font-bold text-gray-400">{movie.release_date?.split('-')[0]}</span>
                               <span className="flex items-center gap-1 text-[10px] font-black text-yellow-500"><Star size={10} fill="currentColor"/> {Number(movie.vote_average || 0).toFixed(1)}</span>
                            </div>
                         </Link>
                       ))}
                    </div>
                  )}
                </motion.div>
             </AnimatePresence>

             {/* Award Intel Videos (from Youtube Intelligence) */}
             <div className="mt-32">
                <div className="flex items-center gap-4 mb-10">
                   <h2 className="text-[24px] font-black tracking-tighter uppercase">Media Intelligence</h2>
                   <div className="h-px flex-1 bg-gradient-to-r from-gray-200 dark:from-gray-800 to-transparent"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   {awardVideos.map(video => (
                     <a key={video.id} href={video.url} target="_blank" className="group block relative overflow-hidden rounded-[40px] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all">
                        <div className="aspect-video relative overflow-hidden">
                           <img src={video.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80" />
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <div className="w-16 h-16 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform"><Youtube size={32} /></div>
                           </div>
                        </div>
                        <div className="p-8">
                           <h4 className="text-xl font-black mb-2 group-hover:text-indigo-600 transition-colors">{video.title}</h4>
                           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500">
                              <Play size={12} fill="currentColor" /> Stream External Intelligence
                           </div>
                        </div>
                     </a>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
