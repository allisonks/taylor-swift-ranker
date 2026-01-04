import React, { useState, useRef, useEffect } from 'react';
import { GripVertical, Share2, Download, LogOut, Palette, Image as ImageIcon, Save, Plus, List, Trash2, Edit2, Check, X, RotateCcw, Settings2, Music2, Folder } from 'lucide-react';
import html2canvas from 'html2canvas';

const SUPABASE_URL = 'https://tucrjbcommnlhjzuxbnr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1Y3JqYmNvbW1ubGhqenV4Ym5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MTE4MDQsImV4cCI6MjA4MjA4NzgwNH0.92JTyHbyGcMs-jcX0CCDVchBeXVuFPMIdQ-vI8KvJkw';

const COLOR_THEMES = {
  torturedPoets: {
    name: 'Tortured Poets',
    bgGradient: 'bg-gradient-to-b from-stone-400 to-orange-50',
    textPrimary: 'text-stone-900',
    textSecondary: 'text-yellow-950'
  },
  midnights: {
    name: 'Midnights',
    bgGradient: 'bg-gradient-to-b from-blue-900 to-cyan-800',
    textPrimary: 'text-sky-50',
    textSecondary: 'text-purple-50'
  },
  folklore: {
    name: 'Folklore',
    bgGradient: 'bg-gradient-to-b from-neutral-500 to-stone-200',
    textPrimary: 'text-black',
    textSecondary: 'text-gray-900'
  },
  evermore: {
    name: 'Evermore',
    bgGradient: 'bg-gradient-to-b from-amber-700 to-stone-500',
    textPrimary: 'text-amber-50',
    textSecondary: 'text-amber-100'
  },
  lover: {
    name: 'Lover',
    bgGradient: 'bg-gradient-to-b from-pink-300 to-blue-300',
    textPrimary: 'text-purple-950',
    textSecondary: 'text-fuscia-950'
  },
  reputation: {
    name: 'Reputation',
    bgGradient: 'bg-gradient-to-b from-neutral-900 to-green-950',
    textPrimary: 'text-stone-50',
    textSecondary: 'text-red-500'
  },
  red: {
    name: 'Red',
    bgGradient: 'bg-gradient-to-b from-red-700 to-orange-900',
    textPrimary: 'text-white',
    textSecondary: 'text-red-200'
  },
  nineteen89: {
    name: '1989',
    bgGradient: 'bg-gradient-to-b from-sky-300 to-orange-50',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-blue-900'
  },
  showgirl: {
    name: 'Showgirl',
    bgGradient: 'bg-gradient-to-b from-teal-600 to-orange-500',
    textPrimary: 'text-white',
    textSecondary: 'text-zinc-100'
  },
  speaknow: {
    name: 'Speak Now',
    bgGradient: 'bg-gradient-to-b from-purple-700 to-pink-800',
    textPrimary: 'text-white',
    textSecondary: 'text-orange-50'
  },
  fearless: {
    name: "Fearless",
    bgGradient: 'bg-gradient-to-b from-yellow-300 to-amber-700',
    textPrimary: 'text-black',
    textSecondary: 'text-amber-950'
  },
  debut: {
    name: 'Debut',
    bgGradient: 'bg-gradient-to-b from-emerald-600 to-cyan-400',
    textPrimary: 'text-white',
    textSecondary: 'text-pink-50'
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
  const [includeBonusTracks, setIncludeBonusTracks] = useState(false);
  const [hasBonusTracks, setHasBonusTracks] = useState(false);
  const [showCustomizeMenu, setShowCustomizeMenu] = useState(false);
  const [showTracksMenu, setShowTracksMenu] = useState(false);
  const [allAvailableTracks, setAllAvailableTracks] = useState([]);
  const [visibleTrackTitles, setVisibleTrackTitles] = useState(new Set());
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchCurrentY, setTouchCurrentY] = useState(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
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
    } else if (name.includes('speak')) {
      return 'speaknow';
    } else if (name.includes('fearless')) {
      return 'fearless';
    } else if (name.includes('red')) {
      return 'red';
    } else {
      return 'torturedPoets';
    }
  };

  useEffect(() => {
    loadAlbums();
  }, []);

  useEffect(() => {
  const handlePopState = (e) => {
    if (showShareView) {
      setShowShareView(false);
    } else if (view === 'ranking') {
      setView('albums');
    }
  };

  window.addEventListener('popstate', handlePopState);
  return () => window.removeEventListener('popstate', handlePopState);
}, [showShareView, view]);


  const loadAlbums = async () => {
    try {
      const data = await supabase.getAlbums();
      // Sort albums by release date (newest first)
      const sortedAlbums = data.sort((a, b) => {
        const dateA = a.release_date ? new Date(a.release_date) : new Date(0);
        const dateB = b.release_date ? new Date(b.release_date) : new Date(0);
        return dateB - dateA;
      });
      setAlbums(sortedAlbums);
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
    
    // Use detailed songs if available, otherwise fall back to simple array
    const baseSongs = album.songs_detailed || album.songs.map(title => ({ title }));
    const bonusSongs = album.bonus_songs_detailed || (album.bonus_songs || []).map(title => ({ title }));
    
    setSongs(baseSongs);
    setOriginalSongs(baseSongs);
    setHasBonusTracks(bonusSongs.length > 0);
    setIncludeBonusTracks(false);
    setAlbumImage(null);
    setRankingName(`My Favorite ${album.name} Tracks`);
    setCurrentRankingId(null);
    setIsEditingTitle(false);

    // Initialize allAvailableTracks and visibleTrackTitles
const allTracks = [...baseSongs, ...bonusSongs];
setAllAvailableTracks(allTracks);
setVisibleTrackTitles(new Set(baseSongs.map(s => s.title || s)));
    
    setCurrentTheme(getAlbumTheme(album.name));
    
    await loadRankings(album.id);
    setView('ranking');
  };

  const loadSavedRanking = (ranking, album = selectedAlbum) => {
    setSongs(ranking.ranked_songs);
    setRankingName(ranking.ranking_name || '');
    setCurrentRankingId(ranking.id);
    setShowRankingsList(false);
    
    // Update visible tracks based on loaded ranking
     if (album) {
      const baseSongs = album.songs_detailed || album.songs.map(title => ({ title }));
      const bonusSongs = album.bonus_songs_detailed || (album.bonus_songs || []).map(title => ({ title }));
      const allTracks = [...baseSongs, ...bonusSongs];
      
      setAllAvailableTracks(allTracks);
      setVisibleTrackTitles(new Set(ranking.ranked_songs.map(s => s.title || s)));
    }

    setMessage('Ranking loaded!');
    setTimeout(() => setMessage(''), 2000);
  };

  const createNewRanking = () => {
    const baseSongs = selectedAlbum.songs_detailed || selectedAlbum.songs.map(title => ({ title }));
    const bonusSongs = selectedAlbum.bonus_songs_detailed || (selectedAlbum.bonus_songs || []).map(title => ({ title }));
    const songsToUse = includeBonusTracks ? [...baseSongs, ...bonusSongs] : baseSongs;
    
    setSongs(songsToUse);
    setOriginalSongs(songsToUse);
    setVisibleTrackTitles(new Set(songsToUse.map(s => s.title || s)));
    setRankingName(`My Favorite ${selectedAlbum.name} Tracks`);
    setCurrentRankingId(null);
    setShowRankingsList(false);
    setIsEditingTitle(false);
    setMessage('Starting new ranking!');
    setTimeout(() => setMessage(''), 2000);
  };
  
  const toggleTrackVisibility = (track) => {
    const trackTitle = track.title || track;
    const newVisible = new Set(visibleTrackTitles);
    
    if (newVisible.has(trackTitle)) {
      newVisible.delete(trackTitle);
      setSongs(songs.filter(s => (s.title || s) !== trackTitle));
    } else {
      newVisible.add(trackTitle);
      const trackToAdd = allAvailableTracks.find(t => (t.title || t) === trackTitle);
      setSongs([...songs, trackToAdd]);
    }
    
    setVisibleTrackTitles(newVisible);
  };

  const resetToOriginal = () => {
    const baseSongs = selectedAlbum.songs_detailed || selectedAlbum.songs.map(title => ({ title }));
    const bonusSongs = selectedAlbum.bonus_songs_detailed || (selectedAlbum.bonus_songs || []).map(title => ({ title }));
    const songsToUse = includeBonusTracks ? [...baseSongs, ...bonusSongs] : baseSongs;
    
    setSongs(songsToUse);
    setOriginalSongs(songsToUse);
    setVisibleTrackTitles(new Set(songsToUse.map(s => s.title || s)));
    setMessage('Tracklist reset!');
    setTimeout(() => setMessage(''), 2000);
  };

  const toggleBonusTracks = () => {
    const baseSongs = selectedAlbum.songs_detailed || selectedAlbum.songs.map(title => ({ title }));
    const bonusSongs = selectedAlbum.bonus_songs_detailed || (selectedAlbum.bonus_songs || []).map(title => ({ title }));
    
    if (!includeBonusTracks) {
      const newSongs = [...songs, ...bonusSongs];
      setSongs(newSongs);
      setOriginalSongs(newSongs);
      setVisibleTrackTitles(new Set(newSongs.map(s => s.title || s)));
    } else {
      const filteredSongs = songs.filter(song => 
        baseSongs.some(bs => (bs.title || bs) === (song.title || song))
      );
      setSongs(filteredSongs);
      setOriginalSongs(baseSongs);
      setVisibleTrackTitles(new Set(baseSongs.map(s => s.title || s)));
    }
    
    setIncludeBonusTracks(!includeBonusTracks);
  };

  const removeSong = (index) => {
    const songToRemove = songs[index];
    const trackTitle = songToRemove.title || songToRemove;
    const newSongs = songs.filter((_, i) => i !== index);
    const newVisible = new Set(visibleTrackTitles);
    newVisible.delete(trackTitle);
    
    setSongs(newSongs);
    setVisibleTrackTitles(newVisible);
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
    e.dataTransfer.setData('text/html', e.currentTarget);
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
  
  const handleTouchStart = (e, index) => {
  setDraggedItem(index);
  setTouchStartY(e.touches[0].clientY);
};

const handleTouchMove = (e) => {
  if (draggedItem === null) return;
  
  e.preventDefault(); // Prevent scrolling while dragging
  
  const touch = e.touches[0];
  const touchY = touch.clientY;
  
  // Get all song items
  const songItems = Array.from(document.querySelectorAll('[data-song-index]'));
  
  // Find which item we're over based on center point
  let targetIndex = null;
  for (let i = 0; i < songItems.length; i++) {
    const rect = songItems[i].getBoundingClientRect();
    const itemCenter = rect.top + (rect.height / 2);
    
    if (touchY < itemCenter) {
      targetIndex = i;
      break;
    }
  }
  
  // If we're past all items, put at end
  if (targetIndex === null) {
    targetIndex = songItems.length - 1;
  }
  
  // Only reorder if different from current position
  if (targetIndex !== draggedItem) {
    const newSongs = [...songs];
    const draggedSong = newSongs[draggedItem];
    
    newSongs.splice(draggedItem, 1);
    newSongs.splice(targetIndex, 0, draggedSong);
    
    setSongs(newSongs);
    setDraggedItem(targetIndex);
  }
};

const handleTouchEnd = () => {
  setDraggedItem(null);
  setTouchStartY(null);
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
                      <h3 className={`text-2xl font-bold ${albumThemeColors.textPrimary}`}>{album.name}</h3>
                      <p className={`${albumThemeColors.textSecondary}`}>{album.artist}</p>
                      <p className={`${albumThemeColors.textSecondary} text-sm mt-2`}>{album.songs.length} songs</p>
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
                         setTimeout(() => loadSavedRanking(ranking, album), 100);
                        }}
                        className={`${albumThemeColors.bgGradient} rounded-xl p-4 hover:scale-105 cursor-pointer transition shadow-lg h-32 flex flex-col justify-center`}
                      >
                         <h3 className={`text-lg font-bold ${albumThemeColors.textPrimary}`}>{ranking.ranking_name || 'Untitled Ranking'}</h3>
                        <p className={`${albumThemeColors.textSecondary} text-sm`}>{album.name}</p>
                        <p className={`${albumThemeColors.textSecondary} text-xs mt-1`}>
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
  const shareUrl = 'taylor-swift-ranker.vercel.app'; // Replace with your actual app URL
  const shareText = `Check out my ${selectedAlbum.name} ranking! Create your own at ${shareUrl}`;
  
  const shareToTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      '_blank',
      'width=550,height=420'
    );
  };
  
  const shareToFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
      '_blank',
      'width=550,height=420'
    );
  };
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setMessage('Link copied to clipboard!');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  return (
    <div className={`min-h-screen ${theme.bgGradient} p-8 flex items-center justify-center relative`}>
      {albumImage && (
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `url(${albumImage})`,
            backgroundSize: '200px 200px',
            backgroundRepeat: 'repeat'
          }}
        />
      )}
      <div className="max-w-2xl w-full relative z-10">
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
            {songs.map((song, index) => {
              const songTitle = song.title || song;
              return (
                <div
                  key={index}
                  className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 flex items-center gap-4"
                >
                  <div className="text-3xl font-bold text-white w-12 text-center">
                    {index + 1}
                  </div>
                  <div className="text-lg text-white flex-1">{songTitle}</div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 text-center text-purple-200 text-sm">
            Made with TAS Songlist
          </div>
        </div>
        
        <div className="mt-6 space-y-4">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6">
            <h3 className="text-white font-bold text-lg mb-4 text-center">Share Your Ranking</h3>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
  <button
    onClick={shareToTwitter}
    className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
  >
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
    Twitter/X
  </button>
  
  <button
    onClick={shareToFacebook}
    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
  >
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
    Facebook
  </button>
  
  <button
    onClick={copyToClipboard}
    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
    Copy Link
  </button>
  
  <button
    onClick={downloadAsImage}
    className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
  >
    <Download size={20} />
    Download
  </button>
</div>
            
            <div className="bg-white bg-opacity-10 rounded-lg p-3 mb-3">
              <p className="text-purple-100 text-sm mb-2 font-semibold">Share message:</p>
              <p className="text-white text-sm">{shareText}</p>
            </div>
            
            <p className="text-purple-200 text-xs text-center">
              Note: For Instagram, download the image and share it from your camera roll
            </p>
          </div>
          
          <button
            onClick={() => setShowShareView(false)}
            className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            Back to Ranking
          </button>
        </div>
      </div>
    </div>
  );
}

   return (
    <div className={`min-h-screen ${theme.bgGradient} relative`}>
      {albumImage && (
      <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `url(${albumImage})`,
            backgroundSize: '200px 200px',
            backgroundRepeat: 'repeat'
          }}
        />
      )}
      
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/60 to-transparent backdrop-blur-sm">
        <div className="p-2 flex items-center justify-between gap-1">
          <button
            onClick={() => setView('albums')}
            className={`flex items-center justify-center bg-white bg-opacity-20 hover:bg-opacity-30 ${theme.textPrimary} p-2 rounded-lg transition`}
            title="Back to Main"
          >
          <span className="text-lg">←</span>
          </button>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setShowRankingsList(!showRankingsList);
                setShowCustomizeMenu(false);
                 setShowShareMenu(false);
               setShowTracksMenu(false);}}
              className={`flex items-center gap-1 bg-white bg-opacity-20 hover:bg-opacity-30 ${theme.textPrimary} px-2 py-2 rounded-lg transition`}
              title="My rankings"
            >
              <Folder size={16} />
              <span className="text-xs">{savedRankings.length}</span>
            </button>
            
            <button
              onClick={() => {
  setShowCustomizeMenu(!showCustomizeMenu);
  setShowRankingsList(false);
  setShowShareMenu(false);
  setShowTracksMenu(false);
}}
              className={`flex items-center justify-center bg-white bg-opacity-20 hover:bg-opacity-30 ${theme.textPrimary} p-2 rounded-lg transition`}
              title="Customize"
            >
              <Settings2 size={16} />
            </button>
            
            <button
              onClick={saveRanking}
              className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition"
              title="Save"
            >
              <Save size={16} />
            </button>
            
            <button
  onClick={() => {
  setShowShareMenu(!showShareMenu);
  setShowRankingsList(false);
  setShowCustomizeMenu(false);
  setShowTracksMenu(false);
}}
  className="flex items-center justify-center bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white p-2 rounded-lg transition"
  title="Share"
>
  <Share2 size={16} />
</button>
                        
            <button
              onClick={() => {
  setShowTracksMenu(!showTracksMenu);
  setShowRankingsList(false);
  setShowCustomizeMenu(false);
  setShowShareMenu(false);
}}
              className={`flex items-center justify-center bg-white bg-opacity-20 hover:bg-opacity-30 ${theme.textPrimary} p-2 rounded-lg transition`}
              title="Manage Tracks"
            >
              <List size={16} />
            </button>
            
            <button
              onClick={handleSignOut}
              className={`flex items-center justify-center bg-white bg-opacity-20 hover:bg-opacity-30 ${theme.textPrimary} p-2 rounded-lg transition`}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
                
        {showTracksMenu && (
          <div className="fixed top-14 right-2 w-72 max-h-96 overflow-y-auto bg-white bg-opacity-95 backdrop-blur-lg rounded-lg shadow-xl z-50 p-4">
            <h3 className="text-gray-800 font-bold mb-3">Manage Tracks</h3>
            
            {hasBonusTracks && (
              <div className="mb-3 pb-3 border-b border-gray-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={includeBonusTracks}
                      onChange={toggleBonusTracks}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-400 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                  </div>
                  <span className="text-xs text-gray-800">Include Bonus Tracks</span>
                </label>
              </div>
            )}
            
            <button
              onClick={() => {
                resetToOriginal();
                setShowTracksMenu(false);
              }}
              className="w-full flex items-center gap-2 text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-lg mb-3 transition"
            >
              <RotateCcw size={16} />
              Reset to Original
            </button>
            
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {allAvailableTracks.length === 0 ? (
                <p className="text-sm text-gray-500 p-2">No tracks available</p>
              ) : (
                allAvailableTracks.map((track, index) => {
                const trackTitle = track.title || track;
                const trackNumber = track.track_number || (index + 1);
                const isVisible = visibleTrackTitles.has(trackTitle);
                
                return (
                  <label key={index} className="flex items-start gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => toggleTrackVisibility(track)}
                      className="mt-1 w-4 h-4 rounded flex-shrink-0"
                    />
                    <span className="text-sm text-gray-800">{trackNumber}. {trackTitle}</span>
                  </label>
                );
 })
              )}
              
            </div>
          </div>
        )}
        {showShareMenu && (
  <div className="fixed top-14 right-2 w-72 max-w-[calc(100vw-1rem)] bg-white bg-opacity-95 backdrop-blur-lg rounded-lg shadow-xl z-[60] p-4">
    <h3 className="text-gray-800 font-bold mb-3">Share Your Ranking</h3>
    
    <div className="space-y-2">
      <button
        onClick={() => {
          const shareUrl = window.location.origin;
          const shareText = `Check out my ${selectedAlbum.name} ranking! Create your own at ${shareUrl}`;
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
            '_blank',
            'width=550,height=420'
          );
          setShowShareMenu(false);
        }}
        className="w-full bg-black hover:bg-gray-900 text-white px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 border border-gray-700"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        Share on Twitter/X
      </button>
      
      <button
        onClick={() => {
          const shareUrl = window.location.origin;
          const shareText = `Check out my ${selectedAlbum.name} ranking! Create your own at ${shareUrl}`;
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
            '_blank',
            'width=550,height=420'
          );
          setShowShareMenu(false);
        }}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        Share on Facebook
      </button>
      
      <button
        onClick={async () => {
          const shareUrl = window.location.origin;
          const shareText = `Check out my ${selectedAlbum.name} ranking! Create your own at ${shareUrl}`;
          try {
            await navigator.clipboard.writeText(shareText);
            setMessage('✓ Link copied to clipboard!');
            setTimeout(() => setMessage(''), 2000);
            setShowShareMenu(false);
          } catch (err) {
            console.error('Failed to copy:', err);
          }
        }}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Copy Link
      </button>
      
      <button
        onClick={() => {
          downloadAsImage();
          setShowShareMenu(false);
        }}
        className="w-full bg-pink-600 hover:bg-pink-700 text-white px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
      >
        <Download size={20} />
        Download as Image
      </button>
    </div>
    
    <p className="text-gray-600 text-xs text-center mt-3">
      For Instagram, download the image and share from your camera roll
    </p>
  </div>
)}
      </div>
      
      <div className="max-w-2xl mx-auto relative z-10 p-8 pt-20 md:pt-8">
        {/* Desktop header */}
        {/* Desktop header */}
<div className="hidden md:flex flex-row justify-between items-center gap-4 mb-8">
  <button
    onClick={() => setView('albums')}
    className={`flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 ${theme.textPrimary} px-4 py-2 rounded-lg transition`}
  >
    <span>←</span>
    <span>Back to Albums</span>
  </button>
  
  <div className="flex items-center gap-2">
    <button
      onClick={() => {
        setShowRankingsList(!showRankingsList);
        setShowCustomizeMenu(false);
        setShowShareMenu(false);
        setShowTracksMenu(false);
      }}
      className={`flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 ${theme.textPrimary} px-3 py-2 rounded-lg transition`}
      title="My rankings"
    >
      <Folder size={18} />
      <span className="text-sm">{savedRankings.length}</span>
    </button>
    
    <button
      onClick={() => {
        setShowCustomizeMenu(!showCustomizeMenu);
        setShowRankingsList(false);
        setShowShareMenu(false);
        setShowTracksMenu(false);
      }}
      className={`flex items-center justify-center bg-white bg-opacity-20 hover:bg-opacity-30 ${theme.textPrimary} p-2 rounded-lg transition`}
      title="Customize"
    >
      <Settings2 size={18} />
    </button>
    
    <button
      onClick={saveRanking}
      className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition"
      title="Save"
    >
      <Save size={18} />
    </button>
    
    <button
      onClick={() => {
        setShowShareMenu(!showShareMenu);
        setShowRankingsList(false);
        setShowCustomizeMenu(false);
        setShowTracksMenu(false);
      }}
      className="flex items-center justify-center bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white p-2 rounded-lg transition"
      title="Share"
    >
      <Share2 size={18} />
    </button>
    
    <button
      onClick={() => {
        setShowTracksMenu(!showTracksMenu);
        setShowRankingsList(false);
        setShowCustomizeMenu(false);
        setShowShareMenu(false);
      }}
      className={`flex items-center justify-center bg-white bg-opacity-20 hover:bg-opacity-30 ${theme.textPrimary} p-2 rounded-lg transition`}
      title="Manage Tracks"
    >
      <List size={18} />
    </button>
    
    <button
      onClick={handleSignOut}
      className={`flex items-center justify-center bg-white bg-opacity-20 hover:bg-opacity-30 ${theme.textPrimary} p-2 rounded-lg transition`}
      title="Sign Out"
    >
      <LogOut size={18} />
    </button>
  </div>
</div>

</div>
<>
{/* Desktop Customize Menu */}
{showCustomizeMenu && (
  <div className="absolute right-0 mt-2 w-56 bg-white bg-opacity-95 backdrop-blur-lg rounded-lg shadow-xl z-10">
    <button
      onClick={() => {
        setShowThemeSelector(true);
        setShowCustomizeMenu(false);
      }}
      className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 text-gray-800 transition"
    >
      <Palette size={18} />
      Change Color Theme
    </button>
    <button
      onClick={() => {
        fileInputRef.current?.click();
        setShowCustomizeMenu(false);
      }}
      className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 text-gray-800 transition"
    >
      <ImageIcon size={18} />
      Upload Album Image
    </button>
    {albumImage && (
      <button
        onClick={() => {
          setAlbumImage(null);
          setShowCustomizeMenu(false);
        }}
        className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 text-red-600 rounded-b-lg transition"
      >
        <X size={18} />
        Remove Image
      </button>
    )}
  </div>
)}

{/* Desktop Tracks Menu */}
{showTracksMenu && (
  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white bg-opacity-95 backdrop-blur-lg rounded-lg shadow-xl z-50 p-4">
    <h3 className="text-gray-800 font-bold mb-3">Manage Tracks</h3>
    
    {hasBonusTracks && (
      <div className="mb-3 pb-3 border-b border-gray-300">
        <label className="flex items-center gap-2 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={includeBonusTracks}
              onChange={toggleBonusTracks}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-400 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
          </div>
          <span className="text-sm text-gray-800">Include Bonus Tracks</span>
        </label>
      </div>
    )}
    
    <button
      onClick={() => {
        resetToOriginal();
        setShowTracksMenu(false);
      }}
      className="w-full flex items-center gap-2 text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-lg mb-3 transition"
    >
      <RotateCcw size={16} />
      Reset to Original
    </button>
    
    <div className="space-y-1 max-h-60 overflow-y-auto">
      {allAvailableTracks.length === 0 ? (
        <p className="text-sm text-gray-500 p-2">No tracks available</p>
      ) : (
        allAvailableTracks.map((track, index) => {
          const trackTitle = track.title || track;
          const trackNumber = track.track_number || (index + 1);
          const isVisible = visibleTrackTitles.has(trackTitle);
          
          return (
            <label key={index} className="flex items-start gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={() => toggleTrackVisibility(track)}
                className="mt-1 w-4 h-4 rounded flex-shrink-0"
              />
              <span className="text-sm text-gray-800">{trackNumber}. {trackTitle}</span>
            </label>
          );
        })
      )}
    </div>
  </div>
)}

{/* Desktop Share Menu */}
{showShareMenu && (
  <div className="absolute right-0 mt-2 w-80 bg-white bg-opacity-95 backdrop-blur-lg rounded-lg shadow-xl z-50 p-4">
    <h3 className="text-gray-800 font-bold mb-3">Share Your Ranking</h3>
    
    <div className="space-y-2">
      <button
        onClick={() => {
          const shareUrl = window.location.origin;
          const shareText = `Check out my ${selectedAlbum.name} ranking! Create your own at ${shareUrl}`;
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
            '_blank',
            'width=550,height=420'
          );
          setShowShareMenu(false);
        }}
        className="w-full bg-black hover:bg-gray-900 text-white px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 border border-gray-700"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        Share on Twitter/X
      </button>
      
      <button
        onClick={() => {
          const shareUrl = window.location.origin;
          const shareText = `Check out my ${selectedAlbum.name} ranking! Create your own at ${shareUrl}`;
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
            '_blank',
            'width=550,height=420'
          );
          setShowShareMenu(false);
        }}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        Share on Facebook
      </button>
      
      <button
        onClick={async () => {
          const shareUrl = window.location.origin;
          const shareText = `Check out my ${selectedAlbum.name} ranking! Create your own at ${shareUrl}`;
          try {
            await navigator.clipboard.writeText(shareText);
            setMessage('✓ Link copied to clipboard!');
            setTimeout(() => setMessage(''), 2000);
            setShowShareMenu(false);
          } catch (err) {
            console.error('Failed to copy:', err);
          }
        }}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Copy Link
      </button>
      
      <button
        onClick={() => {
          downloadAsImage();
          setShowShareMenu(false);
        }}
        className="w-full bg-pink-600 hover:bg-pink-700 text-white px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
      >
        <Download size={20} />
        Download as Image
      </button>
    </div>
    
    <p className="text-gray-600 text-xs text-center mt-3">
      For Instagram, download the image and share from your camera roll
    </p>
  </div>
)}</>

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
    {allRankings.length === 0 ? (
      <p className={`${theme.textSecondary} text-sm`}>No saved rankings yet. Create your first one!</p>
    ) : (
      <div className="space-y-2">
        {allRankings.map((ranking) => {
          const album = albums.find(a => a.id === ranking.album_id);
          if (!album) return null;
          
          const albumTheme = getAlbumTheme(album.name);
          const albumThemeColors = COLOR_THEMES[albumTheme];
          
          return (
            <div
              key={ranking.id}
              className={`${albumThemeColors.bgGradient} rounded-lg p-2 flex justify-between items-center`}
            >
              <button
  onClick={() => {
    selectAlbum(album);
    setTimeout(() => loadSavedRanking(ranking, album), 100);
  }}
  className={`${albumThemeColors.textPrimary} text-left flex-1`}
>
  {ranking.ranking_name || 'Untitled Ranking'}
</button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteRanking(ranking.id);
                }}
                className="text-red-300 hover:text-red-500 ml-2"
                title="Delete ranking"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
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
        </div>

        {message && (
          <div className={`mb-4 ${theme.textPrimary} text-center bg-green-500 bg-opacity-20 p-3 rounded-lg`}>
            {message}
          </div>
        )}

<div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-3 sm:p-6 shadow-2xl mb-4 sm:mb-6 overflow-hidden">        
          <div className="md:px-0 -mx-3 px-3 md:mx-0">
            <div className="space-y-2 sm:space-y-3 md:px-0 px-3">
            {songs.map((song, index) => {
              const songTitle = song.title || song;
              const trackInfo = song.track_number ? 
                `Track ${song.track_number} of ${song.total_tracks} from ${song.album_edition}` : 
                null;
              
              return (
                <div
                  key={`${songTitle}-${index}`}
                  data-song-index={index}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  onTouchStart={(e) => handleTouchStart(e, index)}
                  onTouchMove={(e) => handleTouchMove(e)}
                  onTouchEnd={handleTouchEnd}
                  style={{ touchAction: 'none' }}
                  className={`bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-2 sm:p-4 flex items-center gap-2 sm:gap-3 cursor-move transition-all hover:bg-opacity-30 select-none ${
                    draggedItem === index ? 'opacity-50 scale-95' : ''
                  }`}
                >
                  <div className={`text-base sm:text-2xl font-bold ${theme.textPrimary} w-6 sm:w-12 text-center flex-shrink-0`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm sm:text-lg ${theme.textPrimary} truncate sm:whitespace-normal`}>{songTitle}</div>
                    {trackInfo && (
                      <div className={`text-xs ${theme.textSecondary} mt-0.5 sm:mt-1 truncate sm:whitespace-normal`}>{trackInfo}</div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSong(index);
                    }}
                    className={`${theme.textSecondary} hover:text-red-400 transition flex-shrink-0`}
                    title="Remove track"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>
          </div>
          {/* Hidden element for image generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={shareRef} className={`${theme.bgGradient} rounded-lg p-8 shadow-2xl`} style={{ width: '800px' }}>
          {albumImage && (
            <div className="flex justify-center mb-6">
              <img src={albumImage} alt="Album" className="w-32 h-32 rounded-lg object-cover shadow-lg" />
            </div>
          )}
          <h1 className="text-4xl font-bold text-white text-center mb-2">
            {rankingName || 'My Ranking'}
          </h1>
          <h2 className="text-xl text-purple-200 text-center mb-8">
            {selectedAlbum?.name}
          </h2>
          
          <div className="space-y-3">
            {songs.map((song, index) => {
              const songTitle = song.title || song;
              return (
                <div
                  key={index}
                  className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 flex items-center gap-4"
                >
                  <div className="text-3xl font-bold text-white w-12 text-center">
                    {index + 1}
                  </div>
                  <div className="text-lg text-white flex-1">{songTitle}</div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 text-center text-purple-200 text-sm">
            Made with TAS Songlist
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};


export default TaylorSwiftRanker;