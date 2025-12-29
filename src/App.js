import React, { useState, useRef, useEffect } from 'react';
import { GripVertical, Share2, Download, LogOut, Plus, List, User } from 'lucide-react';
import html2canvas from 'html2canvas';
import './index.css';

const SUPABASE_URL = 'https://tucrjbcommnlhjzuxbnr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1Y3JqYmNvbW1ubGhqenV4Ym5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MTE4MDQsImV4cCI6MjA4MjA4NzgwNH0.92JTyHbyGcMs-jcX0CCDVchBeXVuFPMIdQ-vI8KvJkw';

// Simple Supabase client
class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
    this.authToken = null;
  }

  async request(endpoint, options = {}) {
    const headers = {
      'apikey': this.key,
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${this.url}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async signUp(email, password) {
    const data = await this.request('/auth/v1/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.authToken = data.access_token;
    return data;
  }

  async signIn(email, password) {
    const data = await this.request('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.authToken = data.access_token;
    return data;
  }

  async signOut() {
    this.authToken = null;
  }

  async getAlbums() {
    return this.request('/rest/v1/albums?select=*');
  }

  async getRankings(albumId) {
    return this.request(`/rest/v1/rankings?album_id=eq.${albumId}&select=*`);
  }

  async saveRanking(albumId, rankedSongs) {
    const userId = this.getUserId();
    
    // Check if ranking exists
    const existing = await this.request(
      `/rest/v1/rankings?user_id=eq.${userId}&album_id=eq.${albumId}&select=id`
    );

    if (existing.length > 0) {
      // Update existing
      return this.request(`/rest/v1/rankings?id=eq.${existing[0].id}`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          ranked_songs: rankedSongs,
          updated_at: new Date().toISOString()
        })
      });
    } else {
      // Create new
      return this.request('/rest/v1/rankings', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          album_id: albumId,
          ranked_songs: rankedSongs
        })
      });
    }
  }

  getUserId() {
    if (!this.authToken) return null;
    const payload = JSON.parse(atob(this.authToken.split('.')[1]));
    return payload.sub;
  }

  isAuthenticated() {
    return !!this.authToken;
  }
}

const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_KEY);

const TaylorSwiftRanker = () => {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [songs, setSongs] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [showShareView, setShowShareView] = useState(false);
  const [view, setView] = useState('auth'); // auth, albums, ranking, share
  const [message, setMessage] = useState('');
  const shareRef = useRef(null);

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    try {
      const data = await supabase.getAlbums();
      setAlbums(data);
    } catch (error) {
      console.error('Error loading albums:', error);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setMessage('');
    
    try {
      if (isSignUp) {
        await supabase.signUp(email, password);
        setMessage('Account created! Logging you in...');
      } else {
        await supabase.signIn(email, password);
      }
      setUser({ email });
      setView('albums');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleSignOut = () => {
    supabase.signOut();
    setUser(null);
    setView('auth');
    setEmail('');
    setPassword('');
  };

  const selectAlbum = async (album) => {
    setSelectedAlbum(album);
    setSongs(album.songs);
    
    // Try to load existing ranking
    try {
      const rankings = await supabase.getRankings(album.id);
      const myRanking = rankings.find(r => r.user_id === supabase.getUserId());
      if (myRanking) {
        setSongs(myRanking.ranked_songs);
      }
    } catch (error) {
      console.error('Error loading ranking:', error);
    }
    
    setView('ranking');
  };

  const saveRanking = async () => {
    try {
      await supabase.saveRanking(selectedAlbum.id, songs);
      setMessage('Ranking saved!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error saving ranking: ' + error.message);
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    const newSongs = [...songs];
    const draggedSong = newSongs[draggedItem];
    
    newSongs.splice(draggedItem, 1);
    newSongs.splice(index, 0, draggedSong);
    
    setDraggedItem(index);
    setSongs(newSongs);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDraggedItem(null);
  };

  const downloadAsImage = async () => {
      
    const element = shareRef.current;
    const canvas = await html2canvas(element, {
      backgroundColor: '#1a1a2e',
      scale: 2
    });
    
    const link = document.createElement('a');
    link.download = `${selectedAlbum.name}-ranking.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  // Auth View
  if (view === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-rose-900 p-8 flex items-center justify-center">
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl max-w-md w-full">
          <h1 className="text-4xl font-bold text-white text-center mb-8">
            Album Ranker
          </h1>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 text-white placeholder-purple-200 border border-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
                required
              />
            </div>
            
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 text-white placeholder-purple-200 border border-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
                required
              />
            </div>

            {message && (
              <div className="text-white text-center text-sm bg-white bg-opacity-10 p-3 rounded-lg">
                {message}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-3 rounded-lg font-bold transition"
            >
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-purple-200 hover:text-white text-sm transition"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Albums View
  if (view === 'albums') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-rose-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">Select an Album</h1>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>

          <div className="grid gap-4">
            {albums.map((album) => (
              <div
                key={album.id}
                onClick={() => selectAlbum(album)}
                className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 hover:bg-opacity-20 cursor-pointer transition"
              >
                <h2 className="text-2xl font-bold text-white">{album.name}</h2>
                <p className="text-purple-200">{album.artist}</p>
                <p className="text-purple-300 text-sm mt-2">{album.songs.length} songs</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Share View
  if (showShareView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-rose-900 p-8 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div ref={shareRef} className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-lg p-8 shadow-2xl">
            <h1 className="text-4xl font-bold text-white text-center mb-2">
              My Ranking
            </h1>
            <h2 className="text-xl text-purple-200 text-center mb-8">
              {selectedAlbum.name}
            </h2>
            
            <div className="space-y-3">
              {songs.map((song, index) => (
                <div
                  key={song}
                  className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 flex items-center gap-4"
                >
                  <div className="text-3xl font-bold text-white w-12 text-center">
                    {index + 1}
                  </div>
                  <div className="text-lg text-white flex-1">{song}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center text-purple-200 text-sm">
              Made with Album Ranker
            </div>
          </div>
          
          <div className="mt-6 flex gap-4 justify-center">
            <button
              onClick={downloadAsImage}
              className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition"
            >
              <Download size={20} />
              Download Image
            </button>
            <button
              onClick={() => setShowShareView(false)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Back to Ranking
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ranking View
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-rose-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => setView('albums')}
            className="text-purple-200 hover:text-white flex items-center gap-2 transition"
          >
            ← Back to Albums
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition"
          >
            <LogOut size={20} />
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            Rank Your Favorites
          </h1>
          <h2 className="text-2xl text-purple-200">
            {selectedAlbum.name}
          </h2>
          <p className="text-purple-300 mt-4">
            Drag and drop to reorder the songs
          </p>
        </div>

        {message && (
          <div className="mb-4 text-white text-center bg-green-500 bg-opacity-20 p-3 rounded-lg">
            {message}
          </div>
        )}

        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl mb-6">
          <div className="space-y-3">
            {songs.map((song, index) => (
              <div
                key={`${song}-${index}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 flex items-center gap-4 cursor-move transition-all hover:bg-opacity-30 select-none ${
                  draggedItem === index ? 'opacity-50 scale-95' : ''
                }`}
              >
                <GripVertical className="text-purple-200 flex-shrink-0" size={24} />
                <div className="text-2xl font-bold text-white w-12 text-center flex-shrink-0">
                  {index + 1}
                </div>
                <div className="text-lg text-white flex-1">{song}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={saveRanking}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg transition"
          >
            Save Ranking
          </button>
          <button
            onClick={() => setShowShareView(true)}
            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg transition"
          >
            <Share2 size={24} />
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaylorSwiftRanker;