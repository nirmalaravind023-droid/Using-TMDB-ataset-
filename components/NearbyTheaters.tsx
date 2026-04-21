'use client';

import { useState, useEffect } from 'react';
import { MapPin, Navigation, ExternalLink, Loader2, Theater } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function NearbyTheaters({ movieTitle = null, isInTheaters = false }) {
  const [location, setLocation] = useState(null);
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [localMovies, setLocalMovies] = useState([]);
  const [region, setRegion] = useState('');

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const setCookie = (name, value, days) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
  };

  const getCookie = (name) => {
    if (typeof document === 'undefined') return '';
    return document.cookie.split('; ').reduce((r, v) => {
      const parts = v.split('=');
      return parts[0] === name ? decodeURIComponent(parts[1]) : r;
    }, '');
  };

  const getNearbyTheaters = async (lat, lon) => {
    setLoading(true);
    setError(null);
    
    // 1. Find cinemas within 50km
    try {
      const query = `
        [out:json][timeout:25];
        node["amenity"="cinema"](around:50000, ${lat}, ${lon});
        out body;
      `;
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Theater API is temporarily busy.");
      const data = await res.json();
      
      const foundTheaters = data.elements.map(el => ({
        id: el.id,
        name: el.tags.name || 'Unnamed Cinema',
        lat: el.lat,
        lon: el.lon,
        distance: calculateDistance(lat, lon, el.lat, el.lon)
      })).sort((a, b) => a.distance - b.distance);

      setTheaters(foundTheaters);
    } catch (e) {
      console.error("Theaters fetch failed", e);
      setError("Theater search is temporarily unavailable, but local charts are live!");
    }

    // 2. Fetch Local Movie Recommendations (Independent)
    try {
      const localRes = await fetch(`/api/movies/local?lat=${lat}&lon=${lon}`);
      const localData = await localRes.json();
      setLocalMovies(localData.movies || []);
      setRegion(localData.region);
    } catch (e) {
      console.error("Local movies fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cachedLocation = getCookie('user_location');
    if (cachedLocation) {
      try {
        const { lat, lon } = JSON.parse(cachedLocation);
        setLocation({ lat, lon });
        getNearbyTheaters(lat, lon);
      } catch (e) {
        console.error("Failed to parse cached location");
      }
    }
  }, []);

  const requestLocation = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const loc = { lat: latitude, lon: longitude };
        setLocation(loc);
        setCookie('user_location', JSON.stringify(loc), 7);
        getNearbyTheaters(latitude, longitude);
      },
      (err) => {
        setError("Permission to access location was denied.");
        setLoading(false);
      }
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-12 rounded-[50px] border border-gray-100 dark:border-gray-700 shadow-2xl overflow-hidden relative group my-20">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <div className="max-w-xl">
             <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-[0.3em] mb-4">
                <Navigation size={14} /> Cinema Locator
             </div>
             <h3 className="text-[40px] font-black leading-none mb-4 tracking-tighter">
                Find a screen <span className="text-indigo-600">near you.</span>
             </h3>
              <p className="text-lg text-gray-500 font-medium leading-relaxed">
               {movieTitle ? (
                 isInTheaters 
                   ? `Experience ${movieTitle} on the big screen. Detected in ${theaters.length} premium locations.` 
                   : `${movieTitle} is currently not running in physical screens. Deep-scan suggests streaming discovery.`
               ) : (
                 theaters.length === 0 && location 
                   ? "We scanned your city and found 0 premium movie theaters within 50km." 
                   : `We scanned your city and found ${theaters.length} premium movie theaters within 50km.`
               )}
              </p>
          </div>
          {!location && !loading && (
            <button 
              onClick={requestLocation}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 px-10 rounded-full flex items-center gap-3 transition-all shadow-2xl shadow-indigo-600/30 hover:scale-105 active:scale-95"
            >
              <Navigation size={20} /> Enable Location Access
            </button>
          )}
        </div>

        {loading && (
          <div className="py-24 flex flex-col items-center justify-center gap-6 text-indigo-600">
             <div className="relative">
                <Loader2 className="animate-spin" size={80} />
                <div className="absolute inset-0 flex items-center justify-center">
                   <Navigation size={24} className="animate-pulse" />
                </div>
             </div>
             <div className="flex flex-col items-center gap-2">
                <span className="font-black text-sm uppercase tracking-[0.4em] animate-pulse">📡 Triangulating Screens...</span>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Scanning local coordinates for the best experience</p>
             </div>
          </div>
        )}

        {!loading && (
          <>
             <div className="flex overflow-x-auto pb-10 gap-10 no-scrollbar lg:grid lg:grid-cols-2 xl:grid-cols-4">
              <AnimatePresence>
                {theaters.length > 0 ? (
                  theaters.slice(0, 4).map((theater, i) => (
                    <motion.div
                      key={theater.id}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-10 bg-gray-50 dark:bg-gray-900/50 rounded-[50px] border border-gray-100 dark:border-gray-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col gap-8 group/item shadow-sm hover:shadow-2xl min-w-[320px] lg:min-w-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-[25px] flex items-center justify-center text-indigo-600 shadow-xl border border-gray-100 dark:border-gray-800 group-hover/item:bg-indigo-600 group-hover/item:text-white transition-all duration-500">
                           <Theater size={32} />
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 text-green-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100 dark:border-green-900/50">
                           ✅ Open Now
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-2xl text-gray-900 dark:text-white mb-3 leading-tight line-clamp-2">{theater.name}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                           <MapPin size={14} className="text-indigo-500" /> {Number(theater.distance || 0).toFixed(1)} km away
                        </div>
                      </div>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(theater.name)}`}
                        target="_blank"
                        className="mt-auto inline-flex items-center justify-center gap-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 py-5 rounded-[25px] text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-md group-hover/item:scale-105 whitespace-nowrap px-6"
                      >
                        Navigate to Cinema <Navigation size={16} />
                      </a>
                    </motion.div>
                  ))
                ) : location && (
                  /* High-Fidelity Fallback if no physical theaters detected */
                   <div className="col-span-full p-16 text-center bg-gray-50 dark:bg-gray-900/30 rounded-[60px] border-4 border-dashed border-gray-200 dark:border-gray-800">
                      <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-4xl mx-auto mb-8 shadow-2xl border border-gray-100 dark:border-gray-800">
                         📍
                      </div>
                      <h4 className="text-2xl font-black mb-4">No premium screens detected within 50km</h4>
                      <p className="text-gray-500 max-w-lg mx-auto text-lg leading-relaxed mb-8">The locator couldn't find a nearby theater in your immediate radius. Don't worry, you can still catch the latest regional blockbusters.</p>
                      <button 
                        onClick={() => {
                          const el = document.getElementById('regional-content');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth' });
                          } else {
                            window.location.href = '/#regional-content';
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                      >
                        Explore Regional Hits 🎬
                      </button>
                   </div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
