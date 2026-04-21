'use client';

import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Moon, Sun, MapPin, Navigation, X } from 'lucide-react';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';

// Hardcoded fallback data so you can see the cards even when Docker is offline!
const mockFallbackMovies = [
  { movie_id: 330459, title: 'Rogue One: A Star Wars Story', release_date: '2016-12-14', poster_path: '/vdXGB7oB2A10Awnp5yv0q1PrtvQ.jpg', average_rating: 8.9 },
  { movie_id: 157336, title: 'Interstellar', release_date: '2014-11-05', poster_path: '/gEU2QlsUUHXjNPExFqO72124Amd.jpg', average_rating: 8.6 },
  { movie_id: 438631, title: 'Dune', release_date: '2021-09-15', poster_path: '/d5NXSklXo0qyIYkgV94XAgMIckC.jpg', average_rating: 8.7 },
  { movie_id: 376867, title: 'Moonlight', release_date: '2016-10-21', poster_path: '/q0n5v3H9t3135m5sI419dEbqW0I.jpg', average_rating: 9.2 },
  { movie_id: 346698, title: 'Barbie', release_date: '2023-07-19', poster_path: '/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg', average_rating: 7.2 },
  { movie_id: 872585, title: 'Oppenheimer', release_date: '2023-07-19', poster_path: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', average_rating: 8.1 },
  { movie_id: 155, title: 'The Dark Knight', release_date: '2008-07-16', poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', average_rating: 8.5 },
  { movie_id: 27205, title: 'Inception', release_date: '2010-07-15', poster_path: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', average_rating: 8.4 }
];

import NearbyTheaters from '@/components/NearbyTheaters';
import LocalRecommendations from '@/components/LocalRecommendations';
import LatestTrailers from '@/components/LatestTrailers';
import HeroSlider from '@/components/HeroSlider';

export default function MovieSearch() {
  const { data: session } = useSession();
  const [trendingMovies, setTrendingMovies] = useState(mockFallbackMovies);
  const [boxOfficeMovies, setBoxOfficeMovies] = useState(mockFallbackMovies);
  const [userCountry, setUserCountry] = useState('Global');
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchResults, setSearchResults] = useState({ movies: [], people: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [userLists, setUserLists] = useState([]);
  const [isDark, setIsDark] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [detectedLang, setDetectedLang] = useState('en');
  const [showLocationModal, setShowLocationModal] = useState(false);

  const nextHero = () => {
    setActiveHeroIndex((prev) => (prev + 1) % Math.min(trendingMovies.length, 5));
  };

  const prevHero = () => {
    setActiveHeroIndex((prev) => (prev - 1 + Math.min(trendingMovies.length, 5)) % Math.min(trendingMovies.length, 5));
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearchQuery(q);
    else setSearchQuery('');
  }, [searchParams]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check initial state
    if (typeof navigator !== 'undefined' && !navigator.onLine) setIsOnline(false);

    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }

    // Fetch REAL-TIME Trending (Global This Week)
    fetch('/api/movies/trending')
      .then(res => res.json())
      .then(data => setTrendingMovies(data.length > 0 ? data : mockFallbackMovies));

    // Detect user's country and fetch LOCAL Box Office!
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(locationData => {
        const countryCode = locationData.country_code || 'US';
        const regionName = locationData.region || '';
        setUserCountry(locationData.country_name || 'Global');
        
        // Intelligent Regional Language Shift (India Only)
        if (countryCode === 'IN') {
           let lang = 'hi'; // Default Hindi
           const r = regionName.toLowerCase();
           if (r.includes('karnataka')) lang = 'kn';
           else if (r.includes('tamil')) lang = 'ta';
           else if (r.includes('telangana') || r.includes('andhra')) lang = 'te';
           else if (r.includes('kerala')) lang = 'ml';
           else if (r.includes('maharashtra')) lang = 'mr|hi';
           
           localStorage.setItem('detected_lang', lang);
           setDetectedLang(lang); // TRIGGER IMMEDIATE UI SHIFT
        }

        return fetch(`/api/movies/boxoffice?region=${countryCode}`);
      })
      .then(res => res.json())
      .then(data => setBoxOfficeMovies(data.length > 0 ? data : mockFallbackMovies))
      .catch(() => setBoxOfficeMovies(mockFallbackMovies));

    // Fetch Public Playlists
    fetch('/api/lists')
      .then(res => res.json())
      .then(data => setUserLists(Array.isArray(data) ? data : []))
      .catch(() => setUserLists([]));

    // Check for location permission / cookie
    const locationCookie = document.cookie.split('; ').find(row => row.startsWith('user_location='));
    if (!locationCookie) {
      setTimeout(() => setShowLocationModal(true), 2000); // Premium delay
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Debounced Search Functionality
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        fetch(`/api/movies/search?q=${searchQuery}`)
          .then(res => res.json())
          .then(data => {
            setSearchResults({
              movies: Array.isArray(data.movies) ? data.movies : [],
              people: Array.isArray(data.people) ? data.people : []
            });
            setIsSearching(false);
          })
          .catch(() => setIsSearching(false));
      }, 400); // 400ms debounce
      return () => clearTimeout(timer);
    } else {
      setSearchResults({ movies: [], people: [] });
      setIsSearching(false);
    }
  }, [searchQuery]);

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

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 transition-colors duration-300 pb-20 font-sans text-gray-900 dark:text-gray-100">
      
      {/* Network Suspension Alert */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-0 left-0 right-0 z-[1000] bg-red-600 text-white py-3 px-10 flex items-center justify-between shadow-2xl"
          >
            <div className="flex items-center gap-4">
               <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
               <span className="text-xs font-black uppercase tracking-widest">Network IO Suspended - Computer just woke up</span>
            </div>
            <button onClick={() => window.location.reload()} className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-4 py-1.5 rounded-full hover:bg-white/30 transition-all">
               Reconnect Now
            </button>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-10">

        
        {searchQuery.trim().length > 1 ? (
          /* Search Results Section */
          <div className="mb-20 animate-fade-in">
            <div className="mb-12">
              <h1 className="text-[40px] font-black text-gray-900 dark:text-white mb-2 tracking-tighter">Discovery Results</h1>
              <p className="text-[15px] text-gray-500 dark:text-gray-400">
                {isSearching ? 'Scanning global database...' : `Found ${searchResults.movies.length} movies and ${searchResults.people.length} people for "${searchQuery}"`}
              </p>
            </div>

            {/* People Results */}
            {searchResults.people.length > 0 && (
              <div className="mb-16">
                <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 mb-8">Actors & Crew</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
                  {searchResults.people.map((person) => (
                    <Link href={`/person/${person.id}`} key={person.id} className="group text-center">
                      <div className="relative aspect-square rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 mb-4 shadow-sm group-hover:shadow-2xl transition-all duration-300 ring-4 ring-transparent group-hover:ring-indigo-500/20">
                        {person.profile_path ? (
                          <img src={`https://image.tmdb.org/t/p/w300${person.profile_path}`} className="w-full h-full object-cover scale-100 group-hover:scale-110 transition-transform duration-700" alt={person.name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 dark:bg-gray-800">No Image</div>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{person.name}</h4>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{person.known_for}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Movie Results */}
            {searchResults.movies.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 mb-8">Movies</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {searchResults.movies.map((movie) => (
                    <Link href={`/movie/${movie.id || movie.movie_id}`} key={movie.id || movie.movie_id} className="group cursor-pointer block">
                      <div className="relative overflow-hidden rounded-[35px] aspect-[10/15] bg-gray-200 dark:bg-gray-800 mb-5 shadow-lg group-hover:shadow-[0_20px_40px_-10px_rgba(99,102,241,0.3)] group-hover:scale-[1.02] transition-all duration-700 ring-1 ring-black/5">
                        {movie.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                            alt={movie.title}
                            className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-1000"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                        )}
                        <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-2xl shadow-xl flex items-center gap-1.5 border border-white/20">
                          <Star size={12} className="text-yellow-400" fill="currentColor" />
                          <span className="text-[10px] font-black text-gray-900 dark:text-white">{Number(movie.vote_average || movie.average_rating || 0).toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="px-1">
                        <h3 className="font-black text-gray-900 dark:text-white text-lg truncate mb-1 group-hover:text-indigo-600 transition-colors tracking-tight">{movie.title}</h3>
                        <div className="flex items-center gap-3 text-gray-400 font-bold uppercase tracking-widest text-[9px]">
                          <span>{movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA'}</span>
                          <div className="w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                          <span className="text-indigo-600 dark:text-indigo-400">Movie Intel</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Normal Homepage Content */
          <div className="pt-10">
            <HeroSlider />
            
            {/* High-Impact Discovery Modules (Regional First) */}
            <div className="space-y-32 mb-20" id="regional-content">
               <div className="pt-6">
                  <LocalRecommendations />
               </div>
               <LatestTrailers detectedLang={detectedLang} />
               <NearbyTheaters />
            </div>

            {/* Main content below regional modules */}


            {/* What to watch Section */}
            <div className="mb-20 animate-fade-in">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-[32px] font-extrabold text-gray-900 dark:text-white mb-2">What to watch</h1>
              <p className="text-[15px] text-gray-500 dark:text-gray-400">TV shows and movies selected this week</p>
            </div>
            <button className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 py-2.5 px-5 rounded-full transition-colors">
              Previous week <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory gap-8 pb-10 no-scrollbar scroll-smooth">
            {/* Multi-pass mapping for endless discovery feel */}
            {[...trendingMovies, ...trendingMovies, ...trendingMovies].slice(0, 15).map((movie, i) => (
              <Link href={`/movie/${movie.id || movie.movie_id}`} key={`${movie.id || movie.movie_id}-${i}`} className="min-w-[200px] w-[200px] sm:min-w-[240px] sm:w-[240px] flex-shrink-0 snap-start group cursor-pointer flex flex-col">
                <div className="relative overflow-hidden rounded-[45px] aspect-[2/3] bg-gray-200 dark:bg-gray-800 mb-6 shadow-lg group-hover:shadow-[0_20px_50px_rgba(79,70,229,0.2)] transition-all duration-700 ring-1 ring-black/5">
                  <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md text-indigo-400 font-black text-[10px] px-4 py-2 rounded-full z-10 border border-indigo-500/30 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse"></div>
                    Trending Now
                  </div>
                  <img
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                    alt={movie.title}
                    className="object-cover w-full h-full transform scale-100 group-hover:scale-110 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                     <button className="bg-white text-indigo-600 w-full py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Discovery Engine 🔁</button>
                  </div>
                </div>
                <h3 className="font-black text-gray-900 dark:text-white text-lg truncate px-2 group-hover:text-indigo-600 transition-colors">{movie.title}</h3>
                <div className="flex items-center gap-3 px-2 mt-1.5">
                  <span className="flex items-center gap-1.5 text-xs font-black text-gray-900 dark:text-white">
                    <Star size={16} className="text-[#FFC107]" fill="currentColor" /> {movie.vote_average || movie.average_rating}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(movie.release_date).getFullYear()}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Top box office Section */}
        <div>
          <div className="mb-10">
            <h2 className="text-[32px] font-black tracking-tighter text-gray-900 dark:text-white mb-2">Top Box Office in <span className="text-indigo-600">{userCountry}</span> 📍</h2>
            <p className="text-[15px] text-gray-500 dark:text-gray-400 font-medium">Real-time regional discovery performance</p>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory gap-8 pb-10 no-scrollbar scroll-smooth">
            {[...boxOfficeMovies, ...boxOfficeMovies, ...boxOfficeMovies].slice(0, 15).map((movie, i) => (
              <Link href={`/movie/${movie.id || movie.movie_id}`} key={`${movie.id || movie.movie_id}-${i}`} className="min-w-[180px] w-[180px] sm:min-w-[220px] sm:w-[220px] flex-shrink-0 snap-start group cursor-pointer flex flex-col">
                <div className="relative overflow-hidden rounded-[40px] aspect-[2/3] bg-gray-200 dark:bg-gray-800 mb-6 shadow-md group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all duration-700 ring-1 ring-black/5">
                  <img
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                    alt={movie.title}
                    className="object-cover w-full h-full transform scale-100 group-hover:scale-110 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                     <span className="text-white font-black text-[10px] uppercase tracking-widest text-center border border-white/20 py-2 rounded-xl backdrop-blur-md">Local Hit 📍</span>
                  </div>
                </div>
                <h3 className="font-black text-gray-900 dark:text-white text-lg truncate px-2 group-hover:text-indigo-600 transition-colors">{movie.title}</h3>
                <div className="flex items-center gap-3 px-2 mt-1.5">
                  <span className="flex items-center gap-1.5 text-xs font-black text-gray-900 dark:text-white">
                    <Star size={16} className="text-[#FFC107]" fill="currentColor" /> {movie.vote_average || movie.average_rating}
                  </span>
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-auto">Verified 4K</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* User Playlists Section */}
        {userLists.length > 0 && (
          <div className="mt-20">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-[32px] font-extrabold text-gray-900 dark:text-white mb-2">Member Playlists</h2>
                <p className="text-[15px] text-gray-500 dark:text-gray-400">Curated collections from our community</p>
              </div>
              <Link href="/lists" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">View all lists</Link>
            </div>

            <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {userLists.map((list) => (
                <Link href={`/lists/${list.list_id}`} key={list.list_id} className="min-w-[280px] w-[280px] flex-shrink-0 snap-start group bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate mb-1">{list.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 h-10">{list.description || "A curated collection of movies."}</p>
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-indigo-600 dark:text-indigo-400">By {list.username}</span>
                    <span className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-gray-500">{list.movie_count} Movies</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Crew Picks Editorial Section */}
        <div className="mt-32 mb-32">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent"></div>
            <h2 className="text-[32px] font-black tracking-tighter text-gray-900 dark:text-white uppercase">Editorial Intelligence</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             {/* Denis Villeneuve Card */}
             <div className="relative group rounded-[50px] overflow-hidden bg-gray-900 shadow-2xl aspect-[16/9] md:aspect-auto md:h-[450px]">
                <img 
                  src="https://image.tmdb.org/t/p/original/d5NXSklXo0qyIYkgV94XAgMIckC.jpg" 
                  className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-1000" 
                  alt="Denis Villeneuve"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900 via-indigo-900/40 to-transparent"></div>
                <div className="relative z-10 p-12 h-full flex flex-col justify-end">
                   <span className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 block text-indigo-300">Director's Choice</span>
                   <h3 className="text-4xl font-black mb-4 text-white tracking-tighter">"The Cinematic Experience"</h3>
                   <p className="text-white/80 text-lg leading-relaxed mb-8 max-w-md">This week our crew is highlighting the works of Dennis Villeneuve. A deep dive into the brutalist aesthetics and soundscapes of modern sci-fi.</p>
                   <Link 
                    href="/browse/search?q=villeneuve"
                    className="w-fit bg-white text-indigo-600 font-black py-4 px-10 rounded-2xl shadow-xl hover:bg-indigo-600 hover:text-white transition-all transform hover:-translate-y-1"
                   >
                     Read Intelligence Report
                   </Link>
                </div>
             </div>

             {/* Neo-Noir Card */}
             <div className="relative group rounded-[50px] overflow-hidden bg-black shadow-2xl aspect-[16/9] md:aspect-auto md:h-[450px]">
                <img 
                  src="https://image.tmdb.org/t/p/original/yF1YihvS9S7fcmDqXvYvPdvpWAp.jpg" 
                  className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-1000" 
                  alt="Neo-Noir"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                <div className="relative z-10 p-12 h-full flex flex-col justify-end">
                   <span className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 block text-gray-400">Staff Picks</span>
                   <h3 className="text-4xl font-black mb-4 text-white tracking-tighter">Essential Neo-Noir</h3>
                   <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-md">Shadows, rain-soaked streets, and morally gray protagonists. Discover our essential guide to the neo-noir genre.</p>
                   <Link 
                    href="/browse/search?q=neo-noir"
                    className="w-fit bg-white/10 backdrop-blur-md border border-white/20 text-white font-black py-4 px-10 rounded-2xl hover:bg-white transition-all hover:text-black transform hover:-translate-y-1"
                   >
                     Explore Genre Matrix
                   </Link>
                </div>
             </div>
          </div>
        </div>
        </div>
        )}

      </div>

      {/* Location Permission Modal */}
      <AnimatePresence>
        {showLocationModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLocationModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-gray-800 w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden p-10 border border-gray-100 dark:border-gray-700"
            >
              <button 
                onClick={() => setShowLocationModal(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-[30px] flex items-center justify-center text-indigo-600 mb-8">
                  <MapPin size={40} />
                </div>
                <h2 className="text-3xl font-black mb-4 tracking-tighter">Find a screen near you.</h2>
                <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed mb-10">
                  Allow location access to find premium theaters in your city and discover regional blockbusters trending in your area.
                </p>
                
                <div className="flex flex-col w-full gap-4">
                  <button 
                    onClick={() => {
                      setShowLocationModal(false);
                      document.getElementById('regional-content')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-[25px] flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20"
                  >
                    <Navigation size={20} /> Enable Smart Discovery
                  </button>
                  <button 
                    onClick={() => setShowLocationModal(false)}
                    className="w-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold py-5 rounded-[25px] transition-all"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
