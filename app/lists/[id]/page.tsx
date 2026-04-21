'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Star, MessageCircle, Send, ArrowLeft, Calendar, User, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import useSWR, { mutate } from 'swr';
import { motion, AnimatePresence } from 'framer-motion';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function ListDetailPage({ params }) {
  const { data: session } = useSession();
  const { data: list, error, isLoading } = useSWR(`/api/lists/${params.id}`, fetcher);
  
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const postComment = async () => {
    if (!session) return signIn('keycloak');
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/lists/${params.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentText }),
      });
      if (res.ok) {
        setCommentText('');
        mutate(`/api/lists/${params.id}`); // Refresh data
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 flex items-center justify-center text-gray-500">Loading playlist...</div>;
  if (error || !list || list.error) return <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 flex items-center justify-center text-gray-500">List not found.</div>;

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 transition-colors duration-300 pb-20 font-sans text-gray-900 dark:text-gray-100 p-10">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium mb-12 hover:opacity-80 transition-opacity">
          <ArrowLeft size={20} /> Back to discover
        </Link>

        {/* List Header */}
        <div className="mb-16">
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">
             <User size={14} className="text-indigo-600" /> List by <span className="text-gray-900 dark:text-white">{list.username}</span>
             <span className="mx-2 opacity-20">|</span>
             <Calendar size={14} /> Updated {new Date(list.updated_at).toLocaleDateString()}
          </div>
          <h1 className="text-[56px] font-black leading-tight mb-6 tracking-tighter">{list.title}</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl border-l-4 border-indigo-600 pl-8 py-2">
            {list.description || "No description provided for this collection."}
          </p>
        </div>

        {/* Movie Grid (Letterboxd Style) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-8 mb-20">
          {list.movies?.map((movie, index) => (
            <motion.div 
              key={movie.movie_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/movie/${movie.movie_id}`} className="group block relative">
                <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 shadow-sm group-hover:shadow-2xl group-hover:scale-[1.03] transition-all duration-300 ring-1 ring-black/5">
                  <img 
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                    className="w-full h-full object-cover"
                    alt={movie.title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                     <span className="text-white font-bold text-xs truncate">{movie.title}</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between px-1">
                   <span className="text-[10px] font-black bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-500">{index + 1}</span>
                   <div className="flex items-center gap-1 text-[10px] font-bold text-yellow-500">
                      <Star size={10} fill="currentColor" /> {Number(movie.vote_average || 0).toFixed(1)}
                   </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Discussion Section */}
        <div className="max-w-3xl mt-20 pt-16 border-t border-gray-200 dark:border-gray-800">
          <h2 className="text-3xl font-black mb-10 flex items-center gap-3">
             <MessageCircle size={32} className="text-indigo-600" /> Discussion
             <span className="text-sm font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">{list.comments?.length || 0}</span>
          </h2>

          <div className="space-y-8 mb-12">
            {list.comments?.length === 0 ? (
              <div className="py-12 text-center text-gray-400 italic bg-white dark:bg-gray-800/50 rounded-[40px] border border-dashed border-gray-200 dark:border-gray-700">
                 Be the first to share your thoughts on this list!
              </div>
            ) : (
              list.comments.map((comment) => (
                <div key={comment.comment_id} className="flex gap-6 group">
                   <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-black flex-shrink-0 shadow-sm">
                      {comment.username?.charAt(0).toUpperCase()}
                   </div>
                   <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                         <h4 className="font-bold text-gray-900 dark:text-white">{comment.username}</h4>
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(comment.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed bg-white dark:bg-gray-800 p-6 rounded-[25px] border border-gray-50 dark:border-gray-700 shadow-sm relative">
                         {comment.comment_text}
                         <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-600 transition-all">
                            <MoreHorizontal size={16} />
                         </button>
                      </p>
                      <button className="mt-3 text-[10px] font-bold text-gray-400 hover:text-indigo-600 uppercase tracking-[0.2em] transition-colors ml-4">Reply</button>
                   </div>
                </div>
              ))
            )}
          </div>

          {/* New Comment Form */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-lg ring-1 ring-black/5">
            <h3 className="font-bold mb-6 text-sm uppercase tracking-widest text-gray-400">Post a comment</h3>
            {!session ? (
              <div className="text-center py-4">
                 <button onClick={() => signIn('keycloak')} className="bg-indigo-600 text-white font-bold py-3 px-10 rounded-full shadow-xl shadow-indigo-500/20">Login to Comment</button>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 p-6 rounded-[30px] border-none focus:ring-2 focus:ring-indigo-600 transition-all outline-none text-gray-700 dark:text-gray-300 min-h-[120px]"
                  placeholder="What's your take on this selection?"
                />
                <div className="flex justify-end">
                   <button 
                    disabled={isSubmitting || !commentText.trim()}
                    onClick={postComment}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-4 px-10 rounded-full transition-all shadow-xl shadow-indigo-500/30"
                   >
                     <Send size={18} /> {isSubmitting ? 'Posting...' : 'Post Comment'}
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
