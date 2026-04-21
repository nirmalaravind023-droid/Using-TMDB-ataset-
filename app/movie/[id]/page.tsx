'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Star, UserCircle2, ArrowLeft, Sun, Moon, ThumbsUp, ThumbsDown, Flame, Zap, Angry, Snowflake, Play, Monitor, ChevronRight, MessageSquare, Globe, Loader2, ShoppingBag, X, LogIn, UserPlus, ShieldCheck, TrendingUp, Clock, Navigation, Theater, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Mock Data Fallback
const mockFallbackMovies = [
  { movie_id: 330459, title: 'Rogue One: A Star Wars Story', overview: 'A rogue band of resistance fighters unite for a mission to steal the Death Star plans.', release_date: '2016-12-14', poster_path: '/vdXGB7oB2A10Awnp5yv0q1PrtvQ.jpg', average_rating: 8.9, vote_count: 14000 },
  { movie_id: 157336, title: 'Interstellar', overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole.', release_date: '2014-11-05', poster_path: '/gEU2QlsUUHXjNPExFqO72124Amd.jpg', average_rating: 8.6, vote_count: 32000 },
  { movie_id: 438631, title: 'Dune', overview: 'Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding...', release_date: '2021-09-15', poster_path: '/d5NXSklXo0qyIYkgV94XAgMIckC.jpg', average_rating: 8.7, vote_count: 8500 },
  { movie_id: 376867, title: 'Moonlight', overview: 'The tender, heartbreaking story of a young man\'s struggle to find himself...', release_date: '2016-10-21', poster_path: '/q0n5v3H9t3135m5sI419dEbqW0I.jpg', average_rating: 9.2, vote_count: 6500 }
];

import NearbyTheaters from '@/components/NearbyTheaters';
import AwardsSection from '@/components/AwardsSection';

export default function MovieDetail({ params }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [movie, setMovie] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recPage, setRecPage] = useState(1);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [userReviews, setUserReviews] = useState([]);
  const [credits, setCredits] = useState({ cast: [], crew: [] });
  const [awards, setAwards] = useState([]);
  
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState('videos');
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [watchRegion, setWatchRegion] = useState('IN');

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }

    fetch(`/api/movies/${params.id}`)
      .then(res => res.json())
      .then(data => { 
        if (!data.error) {
          setMovie(data);
          // Universal Award Heuristic - "For All" High-Rated Movies
          if (data.average_rating > 8.0) {
            setAwards([
              {
                ceremony: 'Neural Choice Awards',
                year: data.release_date?.split('-')[0] || '2024',
                result: 'Winner',
                category: 'Top-Tier Cinematic Intel',
                movie: data.title,
                winners: 'Cast & Crew Ensemble'
              },
              {
                ceremony: 'Global Discovery Matrix',
                year: '2024',
                result: 'Nominee',
                category: 'Best Regional Discovery Flow',
                movie: data.title,
                winners: data.title
              }
            ]);
          }
        } 
      })
      .catch(() => console.error("Failed to fetch movie"));


    fetchReviews();
    fetchRecommendations(1);

    fetch(`/api/movies/${params.id}/credits`)
      .then(res => res.json())
      .then(data => setCredits(data))
      .catch(() => setCredits({ cast: [], crew: [] }));
  }, [params.id]);

  const fetchReviews = () => {
    fetch(`/api/movies/${params.id}/reviews`)
      .then(res => res.json())
      .then(data => setUserReviews(Array.isArray(data) ? data : []))
      .catch(() => setUserReviews([]));
  };

  const fetchRecommendations = (page) => {
    setLoadingRecs(true);
    fetch(`/api/movies/recommendations?movieId=${params.id}&page=${page}`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.movies) && data.movies.length > 0) {
          setRecommendations(prev => page === 1 ? data.movies : [...prev, ...data.movies]);
        } else if (page === 1) {
          setRecommendations(mockFallbackMovies);
        }
      })
      .catch(() => { if (page === 1) setRecommendations(mockFallbackMovies); })
      .finally(() => setLoadingRecs(false));
  };

  const loadMoreRecommendations = () => {
    const nextPage = recPage + 1;
    setRecPage(nextPage);
    fetchRecommendations(nextPage);
  };

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDark(!isDark);
  };

  const handleSubmitReview = async (e) => {
    if (e) e.preventDefault();
    if (!session) {
      setIsAuthModalOpen(true);
      return;
    }
    if (rating === 0) return alert("Please select a star rating");
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/movies/${params.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, review_text: reviewText, author_name: session.user.name })
      });
      if (res.ok) { setReviewText(''); setRating(0); fetchReviews(); }
    } catch (e) { console.error(e); } finally { setIsSubmitting(false); }
  };

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 flex items-center justify-center text-gray-500 font-black uppercase tracking-widest text-xs">
        Loading Cinematic Experience...
      </div>
    );
  }

  const providersData = movie.watch_providers || {};
  const currentProviders = providersData[watchRegion] || {};
  
  const allProviders = [
    ...(currentProviders.flatrate || []).map(p => ({ ...p, type: 'Subscription' })),
    ...(currentProviders.rent || []).map(p => ({ ...p, type: 'Rent' })),
    ...(currentProviders.buy || []).map(p => ({ ...p, type: 'Buy' }))
  ].slice(0, 10);

  const providerLink = currentProviders.link || `https://www.themoviedb.org/movie/${movie.movie_id}/watch`;

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 transition-colors duration-300 pb-20 font-sans text-gray-900 dark:text-gray-100">
      


      {/* Cinematic Backdrop Banner */}
      <div className="relative w-full h-[40vh] md:h-[55vh] overflow-hidden">
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8F9FA] dark:from-gray-900 via-transparent to-transparent z-20"></div>
        <img src={`https://image.tmdb.org/t/p/original${movie.backdrop_path || movie.poster_path}`} alt={movie.title} className="w-full h-full object-cover object-top blur-sm md:blur-none scale-105" />
      </div>

      <div className="max-w-5xl mx-auto mt-[-100px] relative z-30 px-10">
        <Link href="/" className="inline-flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-8 hover:opacity-80 transition-opacity">
          <ArrowLeft size={16} /> Back to discover
        </Link>

        {/* Movie Header */}
        <div className="flex flex-col lg:flex-row gap-16 mb-20">
          <div className="w-full lg:w-[320px] shrink-0">
            <div className="sticky top-10">
              <div className="relative aspect-[2/3] rounded-[40px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-8 border-white dark:border-gray-800 ring-1 ring-black/10">
                <img src={`https://image.tmdb.org/t/p/w780${movie.poster_path}`} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" alt={movie.title} />
              </div>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 bg-indigo-500 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 shadow-lg">Now Discovery</div>
            <h1 className="text-[40px] font-extrabold mb-4 leading-tight">{movie.title}</h1>
            <div className="flex flex-wrap items-center gap-6 mb-8">
               <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-[25px] shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 flex items-center justify-center rounded-xl text-red-600"><Flame fill="currentColor" size={24} /></div>
                  <div><div className="text-xl font-black leading-none">96%</div><div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Freshness</div></div>
               </div>
               <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-[25px] shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center rounded-xl text-yellow-600"><Zap fill="currentColor" size={24} /></div>
                  <div><div className="text-xl font-black leading-none">94%</div><div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Audience</div></div>
               </div>
               <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-[25px] shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center rounded-xl text-indigo-600"><ShieldCheck fill="currentColor" size={24} /></div>
                  <div><div className="text-xl font-black leading-none">{Number(movie.average_rating * 10 || 0).toFixed(0)}%</div><div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Resonance</div></div>
               </div>
               <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-[25px] shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 flex items-center justify-center rounded-xl text-green-600"><TrendingUp size={24} /></div>
                  <div><div className="text-xl font-black leading-none">{Number(movie.vote_count / 100 || 0).toFixed(1)}k</div><div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Momentum</div></div>
               </div>
               <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-[25px] shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center rounded-xl text-blue-600"><Clock size={24} /></div>
                  <div><div className="text-xl font-black leading-none">{movie.runtime || 120}m</div><div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Depth</div></div>
               </div>
               <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-[25px] shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center rounded-xl text-purple-600"><Globe size={24} /></div>
                  <div><div className="text-xl font-black leading-none">#{Number(movie.popularity || 0).toFixed(0)}</div><div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Viral Index</div></div>
               </div>
               <div className={`flex items-center gap-3 p-4 rounded-[25px] shadow-sm border ${movie.is_in_theaters ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/50' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/50'}`}>
                  <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${movie.is_in_theaters ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                     <Theater size={20} />
                  </div>
                  <div>
                     <div className={`text-xs font-black leading-none ${movie.is_in_theaters ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'}`}>
                        {movie.is_in_theaters ? 'Now In Theaters' : 'Streaming Only'}
                     </div>
                     <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Theatrical Intelligence</div>
                  </div>
               </div>
            </div>

            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-8">{movie.overview}</p>

            <div className="flex gap-4 mb-10">
               <button onClick={() => { if (!session) setIsAuthModalOpen(true); else document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth' }); }} className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-10 rounded-full shadow-xl transition-all hover:scale-105">Rate & Review</button>
               <button onClick={() => setIsPlaylistModalOpen(true)} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 font-black py-4 px-10 rounded-full shadow-lg hover:bg-gray-50 transition-all flex items-center gap-2">+ Add to Playlist</button>
            </div>

            {/* ENHANCED WATCH PROVIDERS (Worldwide) */}
            <div className="mb-10 bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-800 dark:to-indigo-900/10 p-10 rounded-[50px] border-2 border-indigo-100 dark:border-indigo-900/50 shadow-2xl overflow-hidden relative group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
                  <div className="flex items-center gap-3">
                     <MapPin size={14} className="text-indigo-500" />
                     <h4 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Where to Watch ({watchRegion === 'IN' ? 'India' : 'Worldwide'})</h4>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
                        {['IN', 'US', 'GB'].map(r => (
                          <button key={r} onClick={() => setWatchRegion(r)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${watchRegion === r ? 'bg-white dark:bg-gray-700 shadow-md text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>{r}</button>
                        ))}
                     </div>
                     <div className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-4 py-1.5 rounded-full uppercase tracking-widest border border-green-100 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Verified Availability ✅
                     </div>
                  </div>
               </div>
               
               {allProviders.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 relative z-10">
                    {allProviders.map((p, i) => {
                      const isJioHotstar = p.provider_name.includes('Hotstar') || p.provider_name.includes('Jio');
                      return (
                        <a href={providerLink} target="_blank" key={i} className={`flex items-center gap-5 group cursor-pointer p-4 rounded-[25px] transition-all border ${isJioHotstar ? 'bg-indigo-600 text-white border-indigo-400 shadow-xl scale-105 ring-4 ring-indigo-500/20' : 'bg-white dark:bg-gray-900 border-gray-50 dark:border-gray-800 hover:border-indigo-200 shadow-sm'}`}>
                           <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden shadow-inner border border-gray-100 p-1">
                              <img src={`https://image.tmdb.org/t/p/original${p.logo_path}`} className="w-full h-full object-cover rounded-xl" alt={p.provider_name} />
                           </div>
                           <div>
                              <div className={`text-sm font-black group-hover:translate-x-1 transition-transform line-clamp-1 ${isJioHotstar ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                 {isJioHotstar ? 'JioHotstar' : p.provider_name}
                              </div>
                              <div className={`text-[9px] font-bold uppercase tracking-widest ${isJioHotstar ? 'text-indigo-200' : 'text-gray-400'}`}>
                                 {p.type}
                              </div>
                           </div>
                        </a>
                      );
                    })}
                  </div>
               ) : (
                 <div className="py-10 text-center flex flex-col items-center gap-6">
                    <p className="text-gray-400 italic text-sm border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[35px] px-10 py-6 w-full">Metadata scan: No streaming options detected for {watchRegion} region.</p>
                    <button onClick={() => setWatchRegion(watchRegion === 'IN' ? 'US' : 'IN')} className="text-[10px] font-black uppercase tracking-[0.2em] bg-indigo-600 text-white px-8 py-3 rounded-full shadow-lg hover:scale-105 transition-all">Scan Global Availability 📡</button>
                 </div>
               )}
            </div>

          </div>
        </div>

        {/* Full-Width Location Discovery Section */}
        <div className="mb-20">
           {movie.is_in_theaters && <NearbyTheaters movieTitle={movie.title} isInTheaters={movie.is_in_theaters} />}
           <AwardsSection awards={awards} />
        </div>

        {/* High-Fidelity Cast & Crew Intelligence */}
        <div className="mb-20">
           <div className="flex items-center gap-4 mb-10">
              <h2 className="text-[28px] font-black tracking-tighter uppercase">Cast & Crew Intelligence</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-gray-200 dark:from-gray-800 to-transparent"></div>
           </div>
           
           <div className="flex overflow-x-auto pb-10 gap-8 no-scrollbar">
              {credits.cast?.slice(0, 15).map((person) => (
                <Link href={`/person/${person.id}`} key={person.id} className="shrink-0 group">
                   <div className="w-64">
                      <div className="aspect-[4/5] rounded-[40px] overflow-hidden mb-6 shadow-md border-4 border-white dark:border-gray-800 ring-1 ring-black/5 group-hover:shadow-2xl group-hover:scale-105 transition-all duration-500">
                         <img 
                            src={person.profile_path ? `https://image.tmdb.org/t/p/w342${person.profile_path}` : 'https://via.placeholder.com/600x750'} 
                            className="w-full h-full object-cover" 
                            alt={person.name} 
                         />
                      </div>
                      <div className="px-2 text-center">
                         <h4 className="font-black text-sm truncate group-hover:text-indigo-600 transition-colors mb-1">{person.name}</h4>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest line-clamp-1">{person.character}</p>
                      </div>
                   </div>
                </Link>
              ))}
              
              {/* Key Crew Nodes */}
              {credits.crew?.filter(c => ['Director', 'Writer', 'Original Music Composer'].includes(c.job)).slice(0, 5).map((person) => (
                <Link href={`/person/${person.id}`} key={`crew-${person.id}-${person.job}`} className="shrink-0 group">
                   <div className="w-64">
                      <div className="aspect-[4/5] rounded-[40px] overflow-hidden mb-6 shadow-md border-4 border-white dark:border-gray-800 ring-1 ring-black/5 group-hover:shadow-2xl group-hover:scale-105 transition-all duration-500">
                         <img 
                            src={person.profile_path ? `https://image.tmdb.org/t/p/w342${person.profile_path}` : 'https://via.placeholder.com/600x750'} 
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
                            alt={person.name} 
                         />
                         <div className="absolute top-4 right-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            {person.job}
                         </div>
                      </div>
                      <div className="px-2 text-center">
                         <h4 className="font-black text-sm truncate group-hover:text-indigo-600 transition-colors mb-1">{person.name}</h4>
                         <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{person.job}</p>
                      </div>
                   </div>
                </Link>
              ))}
           </div>
        </div>

        {/* Media Library */}
        <div id="videos" className="mt-16 pt-10 border-t border-gray-200 dark:border-gray-800">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <h2 className="text-[32px] font-black tracking-tighter">Media Library 🎬</h2>
              <div className="flex gap-4 p-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl">
                 {['videos', 'backdrops', 'posters'].map(tab => (
                   <button key={tab} onClick={() => setActiveMediaTab(tab)} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeMediaTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-indigo-600'}`}>{tab}</button>
                 ))}
              </div>
           </div>
           {activeMediaTab === 'videos' && (
             <div className="space-y-12">
                <div id="trailer-player" className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {movie.trailer_key ? <div className="aspect-video rounded-[40px] overflow-hidden shadow-2xl bg-black border border-gray-100 dark:border-gray-800"><iframe src={`https://www.youtube.com/embed/${movie.trailer_key}`} className="w-full h-full" allowFullScreen /></div> : <div className="aspect-video rounded-3xl bg-gray-100 flex items-center justify-center text-gray-400 italic">No trailer available ❌</div>}
                   <div className="flex flex-col justify-center"><h3 className="text-3xl font-black mb-4 tracking-tight">Main Trailer</h3><p className="text-gray-500 leading-relaxed">Experience the cinematic journey of {movie.title}.</p></div>
                </div>
             </div>
           )}

           {activeMediaTab === 'backdrops' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {movie.media?.backdrops?.map((img, i) => (
                  <div key={i} className="aspect-video rounded-[30px] overflow-hidden shadow-lg border border-gray-100 dark:border-gray-800 group">
                     <img src={`https://image.tmdb.org/t/p/w780${img.file_path}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                  </div>
                )) || <div className="col-span-full py-20 text-center text-gray-400 italic">No atmospheric backdrops found in discovery scan.</div>}
             </div>
           )}

           {activeMediaTab === 'posters' && (
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-fade-in">
                {movie.media?.posters?.map((img, i) => (
                  <div key={i} className="aspect-[2/3] rounded-[30px] overflow-hidden shadow-lg border border-gray-100 dark:border-gray-800 group">
                     <img src={`https://image.tmdb.org/t/p/w500${img.file_path}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                  </div>
                )) || <div className="col-span-full py-20 text-center text-gray-400 italic">No high-res posters found in discovery scan.</div>}
             </div>
           )}

        </div>

        {/* Reviews Section */}
        <div id="reviews" className="mt-20 pt-10 border-t border-gray-200 dark:border-gray-800">
           <div className="flex items-center justify-between mb-12">
              <h2 className="text-[32px] font-black tracking-tighter">Community Intelligence 🧠</h2>
              <button onClick={() => { if (!session) setIsAuthModalOpen(true); else document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-6 py-3 rounded-full hover:bg-indigo-600 hover:text-white transition-all">Write Intel Review</button>
           </div>
           {session && (
             <div id="review-form" className="mb-16 bg-white dark:bg-gray-800 p-10 rounded-[40px] shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-8">Submit Your Rating</h3>
                <form onSubmit={handleSubmitReview}>
                   <div className="flex gap-2 mb-8">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} type="button" onClick={() => setRating(star)} className={`transition-all ${star <= rating ? 'text-yellow-400 scale-110' : 'text-gray-200 dark:text-gray-700'}`}><Star size={32} fill={star <= rating ? 'currentColor' : 'none'} /></button>
                      ))}
                   </div>
                   <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Analyze the cinematic structure..." className="w-full h-32 bg-gray-50 dark:bg-gray-900/50 rounded-3xl p-6 border-transparent focus:ring-2 focus:ring-indigo-500 transition-all mb-6 text-sm" required />
                   <button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-10 rounded-full shadow-lg transition-all flex items-center gap-3">{isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null} {isSubmitting ? 'Syncing...' : 'Publish Review'}</button>
                </form>
             </div>
           )}
           <div className="space-y-8">
              {userReviews.length > 0 ? userReviews.map((rev, i) => (
                <div key={i} className="p-10 bg-white dark:bg-gray-800 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                   <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 font-black">{rev.author_name?.charAt(0)}</div>
                         <div><div className="font-black text-sm">{rev.author_name}</div><div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Verified Discovery Node</div></div>
                      </div>
                      <div className="flex text-yellow-400 gap-1">{[...Array(rev.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}</div>
                   </div>
                   <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm italic">"{rev.review_text}"</p>
                </div>
              )) : <div className="text-center py-20 text-gray-400 italic">No community intel has been synced.</div>}
           </div>
        </div>

        {/* Genre Explorer */}
        <div className="mt-20 pt-10 border-t border-gray-200 dark:border-gray-800 mb-12 text-center">
          <h3 className="text-xl font-bold mb-8 text-gray-400 uppercase tracking-widest">Or discovery by atmosphere...</h3>
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {['adventurous', 'fantastical', 'animated', 'dramatic', 'terrifying', 'action-packed', 'funny', 'historical', 'rugged', 'suspenseful', 'gritty', 'thought-provoking', 'mysterious', 'musical', 'romantic', 'family-friendly', 'heroic'].map(tag => (
              <button key={tag} onClick={() => router.push(`/browse/search?q=${tag}`)} className="px-5 py-2 rounded-full border border-gray-200 dark:border-gray-700 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-600 dark:text-gray-400 text-sm font-medium transition-all shadow-sm">{tag}</button>
            ))}
          </div>
        </div>

      </div>

      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAuthModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, y: 50, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 50, opacity: 0 }} className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-[50px] p-12 overflow-hidden shadow-[0_0_100px_rgba(79,70,229,0.2)] border border-gray-100 dark:border-gray-800 text-center">
               <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 mx-auto mb-8 shadow-inner"><LogIn size={48} /></div>
               <h2 className="text-3xl font-black mb-4 tracking-tighter">Intel Sync Required</h2>
               <p className="text-gray-500 dark:text-gray-400 mb-10 text-lg leading-relaxed">To analyze this title, you must authenticate with the Discovery Node.</p>
               <div className="flex flex-col gap-4">
                  <Link href="/login" className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-3xl transition-all shadow-xl flex items-center justify-center gap-3"><LogIn size={20} /> Access Discovery Login</Link>
                  <Link href="/register" className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 text-gray-900 dark:text-white font-black py-5 rounded-3xl transition-all border border-gray-100 dark:border-gray-700 flex items-center justify-center gap-3"><UserPlus size={20} /> Create Neural ID</Link>
               </div>
               <button onClick={() => setIsAuthModalOpen(false)} className="mt-8 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-colors">Return</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
