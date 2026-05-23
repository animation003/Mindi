import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { Users, Layout } from 'lucide-react';

export default function CreateRoomView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { createRoom } = useGame();
  const hostName = location.state?.hostName || 'Host';

  const [playerCount, setPlayerCount] = useState(4);
  const [deckCount, setDeckCount] = useState(52);

  const handlePlayerSelect = (count) => {
    setPlayerCount(count);
    if (count === 6) {
      setDeckCount(102);
    } else {
      if (deckCount === 102) setDeckCount(52);
    }
  };

  const handleCreate = async () => {
    // Generate a random 4 digit code
    const roomCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    await createRoom(roomCode, {
      host: hostName,
      playerCount,
      deckCount,
      createdAt: Date.now()
    });

    navigate(`/room/${roomCode}/lobby`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center animate-slide-up relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
        <div className="w-96 h-96 bg-red-600/20 rounded-full blur-[100px]" />
      </div>

      <h2 className="text-3xl text-gold mb-6 relative z-10" style={{ color: '#d4af37', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
        ✦ CREATE ROOM ✦
      </h2>

      <div className="glass-panel w-full max-w-3xl flex flex-col md:flex-row gap-6 mb-8 relative z-10 landscape-compact">
        {/* Left Side: Select Players */}
        <div className="flex-1 flex flex-col gap-4 border border-red-900/50 p-4 rounded-xl bg-black/40">
          <h3 className="text-sm tracking-widest text-gray-300">1. SELECT PLAYERS</h3>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => handlePlayerSelect(4)}
              className={`flex-1 py-6 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${playerCount === 4 ? 'border-yellow-500 bg-red-900/40 shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'border-red-900/50 bg-black/60 hover:border-red-500/50'}`}
            >
              <Users size={32} className={playerCount === 4 ? 'text-yellow-500' : 'text-gray-400'} />
              <span className={`font-bold ${playerCount === 4 ? 'text-yellow-500' : 'text-gray-400'}`}>4 PLAYERS</span>
            </button>
            <button 
              onClick={() => handlePlayerSelect(6)}
              className={`flex-1 py-6 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${playerCount === 6 ? 'border-yellow-500 bg-red-900/40 shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'border-red-900/50 bg-black/60 hover:border-red-500/50'}`}
            >
              <Users size={32} className={playerCount === 6 ? 'text-yellow-500' : 'text-gray-400'} />
              <span className={`font-bold ${playerCount === 6 ? 'text-yellow-500' : 'text-gray-400'}`}>6 PLAYERS</span>
            </button>
          </div>
        </div>

        {/* Right Side: Select Deck */}
        <div className="flex-1 flex flex-col gap-4 border border-red-900/50 p-4 rounded-xl bg-black/40 relative">
          <h3 className="text-sm tracking-widest text-gray-300">2. SELECT DECK</h3>
          <div className="flex gap-4 justify-center h-full">
            {playerCount === 4 ? (
              <>
                <button 
                  onClick={() => setDeckCount(52)}
                  className={`flex-1 py-6 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${deckCount === 52 ? 'border-yellow-500 bg-red-900/40 shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'border-red-900/50 bg-black/60 hover:border-red-500/50'}`}
                >
                  <Layout size={32} className={deckCount === 52 ? 'text-yellow-500' : 'text-gray-400'} />
                  <span className={`font-bold ${deckCount === 52 ? 'text-yellow-500' : 'text-gray-400'}`}>52 CARDS</span>
                </button>
                <button 
                  onClick={() => setDeckCount(104)}
                  className={`flex-1 py-6 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${deckCount === 104 ? 'border-yellow-500 bg-red-900/40 shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'border-red-900/50 bg-black/60 hover:border-red-500/50'}`}
                >
                  <Layout size={32} className={deckCount === 104 ? 'text-yellow-500' : 'text-gray-400'} />
                  <span className={`font-bold ${deckCount === 104 ? 'text-yellow-500' : 'text-gray-400'}`}>104 CARDS</span>
                </button>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center relative">
                <p className="text-xs text-gray-400 absolute top-0 text-center w-full mt-[-10px]">Two random 2-cards removed</p>
                <button 
                  className="w-full py-6 mt-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 border-yellow-500 bg-red-900/40 shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                >
                  <Layout size={32} className="text-yellow-500" />
                  <span className="font-bold text-yellow-500">102 CARDS</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <button className="btn-3d w-full max-w-sm relative z-10" onClick={handleCreate}>
        CREATE GAME
      </button>
      
      {/* Back button */}
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
