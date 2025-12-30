import React, { useState, useRef, useEffect } from 'react';
import { GripVertical, Share2, Download, LogOut, Palette, Image as ImageIcon, Save, Plus, List, Trash2, Edit2, Check, X, RotateCcw } from 'lucide-react';
import html2canvas from 'html2canvas';

const SUPABASE_URL = 'https://tucrjbcommnlhjzuxbnr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1Y3JqYmNvbW1ubGhqenV4Ym5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MTE4MDQsImV4cCI6MjA4MjA4NzgwNH0.92JTyHbyGcMs-jcX0CCDVchBeXVuFPMIdQ-vI8KvJkw';

const COLOR_THEMES = {
  torturedPoets: {
    name: 'Tortured Poets',
    bgGradient: 'bg-gradient-to-br from-orange-50 via-white to-zinc-200',
    textPrimary: 'text-black',
    textSecondary: 'text-yellow-900'
  },
  midnights: {
    name: 'Midnights',
    bgGradient: 'bg-gradient-to-br from-indigo-950 via-blue-850 to-sky-950',
    textPrimary: 'text-white',
    textSecondary: 'text-purple-100'
  },
  folklore: {
    name: 'Folklore',
    bgGradient: 'bg-gradient-to-br from-stone-600 via-gray-300 to-slate-600',
    textPrimary: 'text-black',
    textSecondary: 'text-gray-900'
  },
  evermore: {
    name: 'Evermore',
    bgGradient: 'bg-gradient-to-br from-amber-700 via-stone-400 to-yellow-700',
    textPrimary: 'text-white',
    textSecondary: 'text-amber-100'
  },
  lover: {
    name: 'Lover',
    bgGradient: 'bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400',
    textPrimary: 'text-white',
    textSecondary: 'text-orange-100'
  },
  reputation: {
    name: 'Reputation',
    bgGradient: 'bg-gradient-to-br from-slate-900 via-black to-green-950',
    textPrimary: 'text-white',
    textSecondary: 'text-red-500'
  },
  red: {
    name: 'Red',
    bgGradient: 'bg-gradient-to-br from-red-900 via-orange-800 to-red-950',
    textPrimary: 'text-white',
    textSecondary: 'text-red-200'
  },
  nineteen89: {
    name: '1989',
    bgGradient: 'bg-gradient-to-br from-sky-400 via-blue-300 to-orange-50',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-blue-900'
  },
  showgirl: {
    name: 'Showgirl',
    bgGradient: 'bg-gradient-to-br from-emerald-600 via-orange-500 to-teal-600',
    textPrimary: 'text-white',
    textSecondary: 'text-zinc-200'
  },
  debut: {
    name: 'Debut',
    bgGradient: 'bg-gradient-to-br from-cyan-600 via-yellow-300 to-emerald-600',
    textPrimary: 'text-white',
    textSecondary: 'text-pink-300'
  }
};

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
      'Prefer': 'return=representation',
      ...options.headers
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${this.url}${endpoint}`, {
      ...options,
      headers
    });

    const text = await response.text();
    
    if (!response.ok) {
      console.error('Response status:', response.status);
      console.error('Response text:', text);
      throw new Error(text || 'Request failed');
    }

    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse JSON:', text);
      throw new Error('Invalid JSON response');
    }
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
    const userId = this.getUserId();
    return this.request(`/rest/v1/rankings?album_id=eq.${albumId}&user_id=eq.${userId}&select=*`);
  }

  async saveRanking(albumId, rankedSongs, rankingName, rankingId = null) {
    const userId = this.getUserId();
    
    if (rankingId) {
      return this.request(`/rest/v1/rankings?id=eq.${rankingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          ranked_songs: rankedSongs,
          ranking_name: rankingName,
          updated_at: new Date().toISOString()
        })
      });
    } else {
      return this.request('/rest/v1/rankings', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          album_id: albumId,
          ranked_songs: rankedSongs,
          ranking_name: rankingName
        })
      });
    }
  }

  async deleteRanking(rankingId) {
    return this.request(`/rest/v1/rankings?id=eq.${rankingId}`, {
      method: 'DELETE'
    });
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
  const [view, setView] = useState('auth');
  const [message, setMessage] = useState('');
  const [currentTheme, setCurrentTheme] = useState('torturedPoets');
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [albumImage, setAlbumImage] = useState(null);
  const [rankingName, setRankingName] = useState('');
  const [currentRankingId, setCurrentRankingId] = useState(null);
  const [savedRankings, setSavedRankings] = useState([]);
  const [allRankings, setAllRankings] = useState([]);
  const [showRankingsList, setShowRankingsList] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempRankingName, setTempRankingName] = useState('');
  const [originalSongs, setOriginalSongs] = useState([]);
  const shareRef = useRef(null);
  const fileInputRef = useRef(null);

  const getUserId = supabase.getUserId.bind(supabase);

  const getAlbumTheme = (albumName) => {
    const name = albumName.toLowerCase();
    if (name.includes('midnights')) {
      return 'midnights';
    } else if (name.includes('evermore')) {
      return 'evermore';
    } else if (name.includes('folklore')) {
      return 'folklore';
    } else if (name.includes('lover')) {
      return 'lover';
    } else if (name.includes('reputation')) {
      return 'reputation';
    } else if (name.includes('1989')) {
      return 'nineteen89';
    } else if (name.includes('showgirl')) {
      return 'showgirl';
     } else if (name.includes('swift')) {
      return 'debut';
    } else if (name.includes('tortured')) {
      return 'torturedPoets';
    } else if (name.includes('red')) {
      return 'red';
    } else {
      return 'torturedPoets';
    }
  };

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    try {
      const data = await supabase.getAlbums();
      setAlbums(data);
      await loadAllRankings();
    } catch (error) {
      console.error('Error loading albums:', error);
    }
  };

  const loadAllRankings = async () => {
    try {
      const userId = supabase.getUserId();
      if (!userId) return;
      const data = await supabase.request(`/rest/v1/rankings?user_id=eq.${userId}&select=*`);
      setAllRankings(data);
    } catch (error) {
      console.error('Error loading all rankings:', error);
    }
  };

  const loadRankings = async (albumId) => {
    try {
      const data = await supabase.getRankings(albumId);
      setSavedRankings(data);
    } catch (error) {
      console.error('Error loading rankings:', error);
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
      await loadAlbums();
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
    setOriginalSongs(album.songs);
    setAlbumImage(null);
    setRankingName(`My Favorite ${album.name} Tracks`);
    setCurrentRankingId(null);
    setIsEditingTitle(false);
    
    setCurrentTheme(getAlbumTheme(album.name));
    
    await loadRankings(album.id);
    setView('ranking');
  };

  const loadSavedRanking = (ranking) => {
    setSongs(ranking.ranked_songs);
    setRankingName(ranking.ranking_name || '');
    setCurrentRankingId(ranking.id);
    setShowRankingsList(false);
    setMessage('Ranking loaded!');
    setTimeout(() => setMessage(''), 2000);
  };

  const createNewRanking = () => {
    setSongs(selectedAlbum.songs);
    setOriginalSongs(selectedAlbum.songs);
    setRankingName(`My Favorite ${selectedAlbum.name} Tracks`);
    setCurrentRankingId(null);
    setShowRankingsList(false);
    setIsEditingTitle(false);
    setMessage('Starting new ranking!');
    setTimeout(() => setMessage(''), 2000);
  };

  const removeSong = (index) => {
    const newSongs = songs.filter((_, i) => i !== index);
    setSongs(newSongs);
  };

  const resetToOriginal = () => {
    setSongs(originalSongs);
    setMessage('Tracklist reset!');
    setTimeout(() => setMessage(''), 2000);
  };

  const startEditingTitle = () => {
    setTempRankingName(rankingName);
    setIsEditingTitle(true);
  };

  const saveTitle = () => {
    setRankingName(tempRankingName);
    setIsEditingTitle(false);
  };

  const cancelEditTitle = () => {
    setIsEditingTitle(false);
  };

  const saveRanking = async () => {
    if (!rankingName.trim()) {
      setMessage('Please enter a name for your ranking!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      await supabase.saveRanking(selectedAlbum.id, songs, rankingName, currentRankingId);
      setMessage('Ranking saved!');
      await loadRankings(selectedAlbum.id);
      await loadAllRankings();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error saving ranking: ' + error.message);
    }
  };

  const deleteRanking = async (rankingId) => {
    if (!window.confirm('Are you sure you want to delete this ranking?')) return;
    
    try {
      await supabase.deleteRanking(rankingId);
      setMessage('Ranking deleted!');
      await loadRankings(selectedAlbum.id);
      await loadAllRankings();
      if (currentRankingId === rankingId) {
        createNewRanking();
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error deleting ranking: ' + error.message);
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

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAlbumImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadAsImage = async () => {
    const element = shareRef.current;
    const canvas = await html2canvas(element, {
      backgroundColor: '#1a1a2e',
      scale: 2
    });
    
    const link = document.createElement('a');
    link.download = `${selectedAlbum.name}-${rankingName || 'ranking'}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const theme = COLOR_THEMES[currentTheme];

  if (view === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 p-8 flex items-center justify-center">
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl max-w-md w-full">
          <h1 className="text-4xl font-bold text-white text-center mb-8">
            TAS Songlist
          </h1>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 text-white placeholder-purple-200 border border-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
              required
            />
            
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 text-white placeholder-purple-200 border border-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
              required
            />

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

  if (view === 'albums') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-400 via-yellow-400 through-green-400 via-blue-400 to-purple-500 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">TAS Songlist</h1>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Start a New List</h2>
              <div className="grid gap-4">
                {albums.map((album) => {
                  const albumTheme = getAlbumTheme(album.name);
                  const albumThemeColors = COLOR_THEMES[albumTheme];
                  
                  return (
                    <div
                      key={album.id}
                      onClick={() => selectAlbum(album)}
                      className={`${albumThemeColors.bgGradient} rounded-xl p-6 hover:scale-105 cursor-pointer transition shadow-lg h-32 flex flex-col justify-center`}
                    >
                      <h3 className="text-2xl font-bold text-white">{album.name}</h3>
                      <p className="text-white text-opacity-80">{album.artist}</p>
                      <p className="text-white text-opacity-70 text-sm mt-2">{album.songs.length} songs</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Pick Up Where You Left Off</h2>
              {allRankings.length === 0 ? (
                <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-8 text-center">
                  <p className="text-white mb-2">No saved rankings yet!</p>
                  <p className="text-purple-100 text-sm">Create your first ranking by selecting an album</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allRankings.map((ranking) => {
                    const album = albums.find(a => a.id === ranking.album_id);
                    if (!album) return null;
                    
                    const albumTheme = getAlbumTheme(album.name);
                    const albumThemeColors = COLOR_THEMES[albumTheme];
                    
                    return (
                      <div
                        key={ranking.id}
                        onClick={() => {
                          selectAlbum(album);
                          setTimeout(() => loadSavedRanking(ranking), 100);
                        }}
                        className={`${albumThemeColors.bgGradient} rounded-xl p-4 hover:scale-105 cursor-pointer transition shadow-lg h-32 flex flex-col justify-center`}
                      >
                        <h3 className="text-lg font-bold text-white">{ranking.ranking_name || 'Untitled Ranking'}</h3>
                        <p className="text-white text-opacity-80 text-sm">{album.name}</p>
                        <p className="text-white text-opacity-70 text-xs mt-1">
                          Last updated: {new Date(ranking.updated_at || ranking.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showShareView) {
    return (
      <div className={`min-h-screen ${theme.bgGradient} p-8 flex items-center justify-center`}>
        <div className="max-w-2xl w-full">
          <div ref={shareRef} className={`${theme.bgGradient} rounded-lg p-8 shadow-2xl`}>
            {albumImage && (
              <div className="flex justify-center mb-6">
                <img src={albumImage} alt="Album" className="w-32 h-32 rounded-lg object-cover shadow-lg" />
              </div>
            )}
            <h1 className="text-4xl font-bold text-white text-center mb-2">
              {rankingName || 'My Ranking'}
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

  return (
    <div className={`min-h-screen ${theme.bgGradient} p-8`}>
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => setView('albums')}
            className={`${theme.textSecondary} hover:${theme.textPrimary} flex items-center gap-2 transition`}
          >
            ← Back to Albums
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRankingsList(!showRankingsList)}
              className={`flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 ${theme.textPrimary} px-4 py-2 rounded-lg transition`}
              title="My rankings"
            >
              <List size={20} />
              <span className="text-sm">{savedRankings.length}</span>
            </button>
            <button
              onClick={() => setShowThemeSelector(!showThemeSelector)}
              className={`flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 ${theme.textPrimary} px-4 py-2 rounded-lg transition`}
              title="Change color theme"
            >
              <Palette size={20} />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 ${theme.textPrimary} px-4 py-2 rounded-lg transition`}
              title="Upload album image"
            >
              <ImageIcon size={20} />
            </button>
            <button
              onClick={handleSignOut}
              className={`flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 ${theme.textPrimary} px-4 py-2 rounded-lg transition`}
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />

        {showRankingsList && (
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className={`${theme.textPrimary} font-semibold`}>My Rankings</h3>
              <button
                onClick={createNewRanking}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition"
              >
                <Plus size={16} />
                New
              </button>
            </div>
            {savedRankings.length === 0 ? (
              <p className={`${theme.textSecondary} text-sm`}>No saved rankings yet. Create your first one!</p>
            ) : (
              <div className="space-y-2">
                {savedRankings.map((ranking) => (
                  <div
                    key={ranking.id}
                    className="bg-white bg-opacity-10 rounded-lg p-3 flex justify-between items-center"
                  >
                    <button
                      onClick={() => loadSavedRanking(ranking)}
                      className={`${theme.textPrimary} hover:${theme.textSecondary} text-left flex-1`}
                    >
                      {ranking.ranking_name || 'Untitled Ranking'}
                    </button>
                    <button
                      onClick={() => deleteRanking(ranking.id)}
                      className="text-red-300 hover:text-red-500 ml-2"
                      title="Delete ranking"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showThemeSelector && (
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-4 mb-4">
            <h3 className={`${theme.textPrimary} font-semibold mb-3`}>Choose Color Theme</h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(COLOR_THEMES).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => {
                    setCurrentTheme(key);
                    setShowThemeSelector(false);
                  }}
                  className={`${t.bgGradient} p-4 rounded-lg hover:scale-105 transition ${
                    currentTheme === key ? 'ring-4 ring-white' : ''
                  }`}
                >
                  <div className={`${t.textPrimary} text-sm font-semibold`}>{t.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          {albumImage && (
            <div className="flex justify-center mb-4">
              <img src={albumImage} alt="Album" className="w-24 h-24 rounded-lg object-cover shadow-lg" />
            </div>
          )}
          
          {isEditingTitle ? (
            <div className="flex items-center justify-center gap-2 mb-4">
              <input
                type="text"
                value={tempRankingName}
                onChange={(e) => setTempRankingName(e.target.value)}
                className={`text-3xl font-bold ${theme.textPrimary} bg-white bg-opacity-20 px-4 py-2 rounded-lg border-2 border-pink-400 focus:outline-none text-center`}
                autoFocus
              />
              <button
                onClick={saveTitle}
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition"
                title="Save title"
              >
                <Check size={20} />
              </button>
              <button
                onClick={cancelEditTitle}
                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition"
                title="Cancel"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 mb-4">
              <h1 className={`text-4xl font-bold ${theme.textPrimary}`}>
                {rankingName}
              </h1>
              <button
                onClick={startEditingTitle}
                className={`${theme.textSecondary} hover:${theme.textPrimary} transition`}
                title="Edit title"
              >
                <Edit2 size={24} />
              </button>
            </div>
          )}
          
          <p className={`${theme.textSecondary} text-sm`}>
            Drag and drop to reorder the songs
          </p>
        </div>

        {message && (
          <div className={`mb-4 ${theme.textPrimary} text-center bg-green-500 bg-opacity-20 p-3 rounded-lg`}>
            {message}
          </div>
        )}

        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>
              {songs.length} of {originalSongs.length} tracks
            </h3>
            <button
              onClick={resetToOriginal}
              className={`flex items-center gap-2 ${theme.textSecondary} hover:${theme.textPrimary} transition`}
              title="Reset to original tracklist"
            >
              <RotateCcw size={20} />
              Reset
            </button>
          </div>
          
          <div className="space-y-3">
            {songs.map((song, index) => (
              <div
                key={`${song}-${index}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                className={`bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 flex items-center gap-4 cursor-move transition-all hover:bg-opacity-30 select-none ${
                  draggedItem === index ? 'opacity-50 scale-95' : ''
                }`}
              >
                <GripVertical className={theme.textSecondary} size={24} />
                <div className={`text-2xl font-bold ${theme.textPrimary} w-12 text-center flex-shrink-0`}>
                  {index + 1}
                </div>
                <div className={`text-lg ${theme.textPrimary} flex-1`}>{song}</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSong(index);
                  }}
                  className={`${theme.textSecondary} hover:text-red-400 transition flex-shrink-0`}
                  title="Remove track"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={saveRanking}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition"
          >
            <Save size={24} />
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