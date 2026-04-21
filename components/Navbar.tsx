'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, Star, Zap, Activity } from 'lucide-react';
import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Navbar() {
  const { data: session } = useSession();
  const [isDark, setIsDark] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim().length > 1) {
       router.push(`/?q=${encodeURIComponent(query)}`);
    } else if (query.trim().length === 0) {
       router.push('/');
    }
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-[1000] bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border-b border-gray-100 dark:border-gray-800 px-10 py-5 flex items-center justify-between transition-all duration-300">
      {/* Universal Discovery Brand */}
      <Link href="/" className="flex items-center gap-3 cursor-pointer group shrink-0">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl shadow-indigo-600/20">
          <div className="w-3.5 h-3.5 bg-indigo-600 rounded-full animate-pulse"></div>
        </div>
        <div className="flex flex-col">
           <span className="text-xl font-black tracking-tighter uppercase leading-none">moviePortal</span>
           <span className="text-[7px] font-black uppercase tracking-[0.4em] text-indigo-600 mt-1">Discovery Node</span>
        </div>
      </Link>

      {/* Discovery Command Center (Search) */}
      <div className="flex-1 max-w-2xl px-12 hidden md:block">
        <div className="relative group">
           <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
              <Star size={18} />
           </div>
           <input 
              type="text" 
              placeholder="Search cinematic universe, talent, or intelligence..." 
              value={searchQuery}
              onChange={handleSearch}
              className="w-full bg-gray-100 dark:bg-gray-800/50 border-none rounded-2xl py-4 pl-14 pr-20 text-sm font-semibold focus:ring-2 focus:ring-indigo-600 transition-all outline-none shadow-inner"
           />
           <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-white/40 dark:bg-black/20 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/10">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>
              <span className="text-[7px] font-black uppercase text-indigo-600 tracking-widest">Live</span>
           </div>
        </div>
      </div>

      {/* Action Core */}
      <div className="flex items-center gap-8 shrink-0">
        <div className="hidden lg:flex items-center gap-6 border-r border-gray-200 dark:border-gray-800 pr-8">
           <Link href="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-all">
              <Zap size={14} /> Trending
           </Link>
           <Link href="/watchlist" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-all">
              <Activity size={14} /> Activity
           </Link>
        </div>

        <button onClick={toggleTheme} className="w-11 h-11 flex items-center justify-center text-gray-500 hover:text-indigo-600 transition-all rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:border-indigo-500/30">
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {session ? (
          <div className="flex items-center gap-4 group cursor-pointer">
             <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Authenticated</span>
                <span className="text-xs font-black">{session.user.name.split(' ')[0]}</span>
             </div>
             <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-xl shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                {session.user.name.charAt(0).toUpperCase()}
             </div>
          </div>
        ) : (
          <button onClick={() => signIn()} className="text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white px-8 py-3.5 rounded-2xl hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95">Sync Intel</button>
        )}
      </div>
    </nav>
  );
}
