'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, X, Search, ListPlus } from 'lucide-react';

export default function NewListPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedMovies, setSelectedMovies] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search movies to add to list
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        fetch(`/api/movies/search?q=${searchQuery}`)
          .then(res => res.json())
          .then(data => {
            setSearchResults(Array.isArray(data) ? data : []);
            setIsSearching(false);
          })
          .catch(() => setIsSearching(false));
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  const addMovie = (movie) => {
    if (!selectedMovies.find(m => m.movie_id === (movie.id || movie.movie_id))) {
      setSelectedMovies([...selectedMovies, {
        movie_id: movie.id || movie.movie_id,
        title: movie.title,
        poster_path: movie.poster_path
      }]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeMovie = (movieId) => {
    setSelectedMovies(selectedMovies.filter(m => m.movie_id !== movieId));
  };

  const handleCreateList = async () => {
    if (!title || selectedMovies.length === 0) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, isPublic }),
      });

      if (res.ok) {
        const list = await res.json();
        
        // Add all selected movies to the list
        for (const movie of selectedMovies) {
          await fetch(`/api/lists/${list.list_id}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ movieId: movie.movie_id }),
          });
        }
        
        router.push(`/lists/${list.list_id}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) return <div className="p-20 text-center">Please login to create lists.</div>;

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 transition-colors p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-[40px] font-black mb-10 flex items-center gap-4">
          <ListPlus size={40} className="text-indigo-600" /> Create New List
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Left: Metadata */}
          <div className="md:col-span-2 space-y-8">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">List Title</label>
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., My Favorite Neo-Noir Gems"
                className="w-full text-2xl font-bold bg-transparent border-b-2 border-gray-200 dark:border-gray-800 outline-none focus:border-indigo-600 transition-colors py-2"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this list about?"
                className="w-full bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 outline-none h-40 focus:ring-2 focus:ring-indigo-600 transition-all"
              />
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Add Movies</label>
                <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-xs">{selectedMovies.length} Selected</span>
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
                  <Search size={20} />
                </div>
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search and add movies..."
                  className="w-full bg-white dark:bg-gray-800 pl-14 pr-6 py-5 rounded-[30px] border border-gray-100 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm"
                />

                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-4 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden max-h-[400px] overflow-y-auto">
                    {searchResults.map((movie) => (
                      <button 
                        key={movie.id || movie.movie_id}
                        onClick={() => addMovie(movie)}
                        className="w-full p-4 flex items-center gap-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-left transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0"
                      >
                        <img 
                          src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} 
                          className="w-12 rounded-lg" 
                        />
                        <div>
                          <h4 className="font-bold">{movie.title}</h4>
                          <p className="text-xs text-gray-500">{movie.release_date?.split('-')[0]}</p>
                        </div>
                        <Plus size={20} className="ml-auto text-indigo-600" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Movies Preview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4">
                {selectedMovies.map((movie) => (
                  <div key={movie.movie_id} className="relative group aspect-[2/3] rounded-2xl overflow-hidden bg-gray-200 shadow-sm">
                    <img src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removeMovie(movie.movie_id)}
                      className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
                    >
                      <X size={16} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white">
                       <p className="text-xs font-bold truncate">{movie.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm sticky top-10">
              <h3 className="font-bold text-xl mb-6">List Settings</h3>
              
              <div className="flex items-center justify-between mb-8">
                <span className="font-medium">Public Visibility</span>
                <button 
                  onClick={() => setIsPublic(!isPublic)}
                  className={`w-14 h-8 rounded-full transition-all relative p-1 ${isPublic ? 'bg-indigo-600' : 'bg-gray-300'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              <p className="text-xs text-gray-400 mb-8 leading-relaxed italic">Public lists are featured on the homepage and searchable by other members.</p>

              <button 
                disabled={!title || selectedMovies.length === 0 || isSubmitting}
                onClick={handleCreateList}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-5 rounded-[25px] transition-all shadow-xl shadow-indigo-500/30"
              >
                {isSubmitting ? 'Creating...' : 'Launch List'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
