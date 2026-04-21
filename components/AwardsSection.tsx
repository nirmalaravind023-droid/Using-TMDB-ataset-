'use client';

import { motion } from 'framer-motion';
import { Award, Trophy, Medal, Star, ShieldCheck, ChevronRight } from 'lucide-react';

export default function AwardsSection({ awards = [] }) {
  if (!awards || awards.length === 0) return null;

  return (
    <div className="mt-20">
      <div className="flex items-center gap-4 mb-10">
        <h2 className="text-[28px] font-black tracking-tighter uppercase">Awards & Accolades</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-gray-200 dark:from-gray-800 to-transparent"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {awards.map((award, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative p-8 rounded-[40px] border-2 transition-all ${award.result === 'Winner' ? 'bg-indigo-600 text-white border-indigo-400 shadow-xl scale-[1.02]' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-sm hover:border-indigo-200'}`}
          >
            {award.result === 'Winner' && (
              <div className="absolute -top-4 -right-4 bg-yellow-400 text-black px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 border-4 border-indigo-600">
                <Trophy size={14} /> Winner
              </div>
            )}
            
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${award.result === 'Winner' ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'}`}>
                   {award.ceremony.includes('Filmfare') ? <Medal size={24} /> : <Star size={24} />}
                </div>
                <div>
                   <h4 className={`text-xs font-black uppercase tracking-[0.2em] ${award.result === 'Winner' ? 'text-indigo-200' : 'text-gray-400'}`}>{award.ceremony}</h4>
                   <div className="text-[10px] font-bold opacity-60">{award.year}</div>
                </div>
              </div>

              <h3 className="text-xl font-black mb-2 leading-tight">{award.category}</h3>
              <p className={`text-sm font-medium mb-6 ${award.result === 'Winner' ? 'text-white/80' : 'text-gray-500'}`}>{award.movie}</p>

              {award.winners && (
                <div className="mt-auto pt-6 border-t border-white/10 dark:border-gray-700/50">
                   <div className={`text-[9px] font-black uppercase tracking-widest mb-3 ${award.result === 'Winner' ? 'text-indigo-200' : 'text-gray-400'}`}>Honorees</div>
                   <div className="flex flex-wrap gap-2">
                      {award.winners.split(', ').map((name, idx) => (
                        <span key={idx} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold ${award.result === 'Winner' ? 'bg-white/10' : 'bg-gray-100 dark:bg-gray-900'}`}>{name}</span>
                      ))}
                   </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
