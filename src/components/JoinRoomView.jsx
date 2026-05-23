import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';

export default function JoinRoomView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { joinRoom } = useGame();
  
  const playerName = location.state?.playerName || 'Player';
  const [manualCode, setManualCode] = useState('');
  
  const [activeRooms, setActiveRooms] = useState([]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const q = query(
          collection(db, "rooms"),
          where("state", "==", "waiting"),
          limit(20)
        );
        const querySnapshot = await getDocs(q);
        const available = [];
        const tenMinutes = 10 * 60 * 1000;
        const now = Date.now();
        
        querySnapshot.forEach((doc) => {
          const r = doc.data();
          if (!r.settings || !r.settings.createdAt) return;
          
          const age = now - r.settings.createdAt;
          if (age > tenMinutes) return; // Hide rooms older than 10 minutes
          
          const currentPlayers = Object.keys(r.players || {}).length;
          if (currentPlayers < r.settings.playerCount) {
             available.push(r);
          }
        });
        
        // Sort by newest locally to avoid needing Firestore composite index
        available.sort((a, b) => b.settings.createdAt - a.settings.createdAt);
        setActiveRooms(available.slice(0, 4));
      } catch (e) {
        console.error("Error fetching rooms:", e);
      }
    };
    fetchRooms();
  }, []);

  const handleJoinManual = async () => {
    if (manualCode.length !== 4) {
      alert("Please enter a valid 4-digit code");
      return;
    }
    const success = await joinRoom(manualCode, playerName);
    if (success) {
      navigate(`/room/${manualCode}/lobby`);
    } else {
      alert("Room not found or full.");
    }
  };

  const handleJoinList = async (code) => {
    const success = await joinRoom(code, playerName);
    if (success) {
      navigate(`/room/${code}/lobby`);
    }
  };

  const getTimeAgo = (timestamp) => {
    const diff = Math.floor((Date.now() - timestamp) / 60000);
    if (diff === 0) return 'Just now';
    return `${diff}m ago`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-slide-up relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
        <div className="w-[600px] h-[600px] bg-red-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-6 relative z-10 landscape-compact">
        
        {/* Left Side: Join by Code */}
        <div className="flex-1 glass-panel flex flex-col items-center justify-center p-8 border border-red-900/50 bg-black/40">
          <h2 className="text-2xl text-gold mb-8 text-center tracking-widest" style={{ color: '#d4af37' }}>
            JOIN ROOM
          </h2>
          
          <div className="w-full max-w-xs flex flex-col gap-6 items-center">
            <div className="w-full text-center">
              <label className="block text-sm text-gray-300 mb-2 tracking-widest">ENTER ROOM CODE</label>
              <input 
                type="text" 
                placeholder="0000" 
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.replace(/[^0-9]/g, '').slice(0,4))}
                className="w-full text-center tracking-[0.5em] font-bold text-2xl"
                style={{
                  background: 'rgba(0,0,0,0.6)',
                  border: '2px solid rgba(150, 0, 0, 0.5)',
                  borderRadius: '12px',
                  padding: '12px',
                  color: '#fff',
                  boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.8)'
                }}
              />
            </div>

            <button 
              className="btn-3d w-full"
              onClick={handleJoinManual}
            >
              JOIN
            </button>
          </div>
        </div>

        {/* Right Side: Room List */}
        <div className="flex-[1.5] glass-panel flex flex-col border border-red-900/50 bg-black/40 p-6">
          <h2 className="text-xl text-gold mb-4 text-center tracking-widest border-b border-red-900/50 pb-4" style={{ color: '#d4af37' }}>
            ROOM LIST
          </h2>
          
          <div className="flex flex-col gap-3 overflow-y-auto pr-2">
            {/* Table Header */}
            <div className="flex justify-between px-4 text-xs tracking-widest text-gray-400 mb-2 font-bold">
              <span className="w-20 text-center">ROOM CODE</span>
              <span className="w-20 text-center">PLAYERS</span>
              <span className="w-20 text-center">DECK</span>
              <span className="w-20 text-center">TIME</span>
            </div>

            {activeRooms.length === 0 ? (
              <p className="text-gray-400 text-center py-8 italic">No active rooms found</p>
            ) : (
              activeRooms.map(room => {
                const currentPlayers = Object.keys(room.players).length;
                return (
                  <div 
                    key={room.id}
                    onClick={() => handleJoinList(room.id)}
                    className="flex justify-between items-center px-4 py-4 rounded-xl cursor-pointer transition-all hover:bg-red-900/40 bg-black/60 border border-red-900/30 hover:border-yellow-500/50"
                  >
                    <span className="w-20 text-center font-bold tracking-widest">{room.id}</span>
                    <span className="w-20 text-center text-gray-300">{currentPlayers}/{room.settings.playerCount}</span>
                    <span className="w-20 text-center text-gray-300">{room.settings.deckCount} Cards</span>
                    <span className="w-20 text-center text-gray-400 text-sm">{getTimeAgo(room.settings.createdAt)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
        
      </div>

      <button 
        className="absolute top-4 left-4 text-gray-300 hover:text-white z-20 flex items-center gap-2"
        onClick={() => navigate('/')}
      >
        <div className="w-8 h-8 rounded-full border border-gray-500 flex items-center justify-center bg-black/50">
          ←
        </div>
      </button>
    </div>
  );
}
