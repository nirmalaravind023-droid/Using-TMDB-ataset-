'use client';

import { useSession } from 'next-auth/react';
import { User, Calendar, Star, TrendingUp, Edit3, MessageSquare, Play, ChevronRight, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ProfilePage() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-gray-900 transition-colors">
        <div className="text-center">
           <h2 className="text-2xl font-bold mb-4">Please log in to view your profile</h2>
           <Link href="/login" className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold shadow-lg">Login</Link>
        </div>
      </div>
    );
  }

  // Mock Stats for high-fidelity UI
  const stats = [
    { label: 'Total Edits', value: 0, icon: <Edit3 size={18} /> },
    { label: 'Total Ratings', value: 1, icon: <Star size={18} /> },
    { label: 'Average Movie Score', value: 8.5, icon: <BarChart3 size={18} /> },
    { label: 'Average TV Score', value: 0, icon: <TrendingUp size={18} /> }
  ];

  const ratingCounts = [0, 0, 0, 0, 0, 0, 0, 1, 0, 0]; // Histogram mock

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 transition-colors duration-300 pb-20 font-sans text-gray-900 dark:text-gray-100 p-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-10 mb-16">
          <div className="w-32 h-32 bg-indigo-600 rounded-full flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-indigo-500/30">
            {session.user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="text-center md:text-left">
             <h1 className="text-[56px] font-black tracking-tighter leading-none mb-2">{session.user?.name}</h1>
             <p className="flex items-center justify-center md:justify-start gap-2 text-gray-500 font-medium">
               <Calendar size={18} /> Member since April 2026
             </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Stats Column */}
          <div className="space-y-8">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 mb-6">Stats Overview</h2>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                   <div className="text-indigo-600 mb-4">{stat.icon}</div>
                   <div className="text-2xl font-black">{stat.value}</div>
                   <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
               <h3 className="text-sm font-black uppercase tracking-widest mb-8">Rating Overview</h3>
               <div className="flex items-end justify-between h-32 gap-1 px-2">
                  {ratingCounts.map((count, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                       <div 
                        className={`w-full rounded-t-lg transition-all ${count > 0 ? 'bg-indigo-600' : 'bg-gray-100 dark:bg-gray-700'}`} 
                        style={{ height: `${count > 0 ? 100 : 10}%` }}
                       ></div>
                       <span className="text-[10px] font-bold text-gray-400">{i + 1}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* Activity & Discovery Column */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Watchlist Section */}
            <section>
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-2xl font-black tracking-tight">Upcoming From Watchlist</h2>
                 <Link href="/watchlist" className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:underline">Go to Watchlist</Link>
              </div>
              <div className="p-12 bg-white dark:bg-gray-800 rounded-[50px] border border-dashed border-gray-200 dark:border-gray-700 text-center">
                 <p className="text-gray-400 italic">There are no upcoming movies on your watchlist.</p>
              </div>
            </section>

            {/* Most Watched Genres */}
            <section>
              <h2 className="text-2xl font-black tracking-tight mb-8">Most Watched Genres</h2>
              <div className="flex flex-wrap gap-3">
                 {['Science Fiction', 'Comedy', 'Romance', 'Action', 'Thriller'].map(genre => (
                   <div key={genre} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-6 py-3 rounded-2xl font-bold text-sm shadow-sm hover:border-indigo-600 transition-all cursor-default">
                      {genre}
                   </div>
                 ))}
              </div>
            </section>

            {/* Recent Activity */}
            <section>
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-2xl font-black tracking-tight">Recent Activity</h2>
                 <span className="text-xs font-black uppercase tracking-widest text-gray-400 cursor-pointer">View More</span>
              </div>
              <div className="space-y-4">
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-6">
                    <div className="w-12 h-12 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 rounded-2xl flex items-center justify-center shrink-0">
                       <Star size={24} fill="currentColor" />
                    </div>
                    <div>
                       <h4 className="font-bold">Rated "Your Heart Will Be Broken"</h4>
                       <p className="text-sm text-gray-500">You gave this movie a score of 8/10</p>
                    </div>
                    <span className="ml-auto text-xs text-gray-400">2h ago</span>
                 </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
