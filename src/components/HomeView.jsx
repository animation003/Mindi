import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spade, Heart, Club, Diamond } from 'lucide-react';

export default function HomeView() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [nickname, setNickname] = useState('');

  // Loading simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsLoading(false), 600); // Wait a moment at 100% before transition
          return 100;
        }
        return prev + 3; // Load speed
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleCreateGame = () => {
    if (!nickname.trim()) {
      alert("Please enter your name");
      return;
    }
    // Navigate to create room page, passing the nickname
    navigate('/create', { state: { hostName: nickname } });
  };

  const handleJoinGame = () => {
    if (!nickname.trim()) {
      alert("Please enter your name");
      return;
    }
    // Navigate to join room page, passing the nickname
    navigate('/join', { state: { playerName: nickname } });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <div className="mb-12 animate-float flex flex-col items-center">
          <h1 
            className="text-7xl font-black text-transparent bg-clip-text filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]"
            style={{ 
              backgroundImage: 'linear-gradient(to bottom, #ffffff, #a0a0a0 40%, #505050 50%, #ffffff 60%)',
              WebkitTextStroke: '2px #000'
            }}
          >
            MINDI
          </h1>
          <p className="text-sm text-gray-300 mt-2 tracking-widest italic font-light">Created By Chirag</p>
        </div>
        
        {/* Loading Bar */}
        <div className="w-64 h-3 bg-black/60 rounded-full overflow-hidden border border-red-900/50 relative shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-red-600 via-red-500 to-red-400 transition-all duration-75 ease-out shadow-[0_0_10px_rgba(255,0,0,0.8)]"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center animate-slide-up relative">
      {/* Smoke/Glow Effect background element */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
        <div className="w-96 h-96 bg-red-600/30 rounded-full blur-[100px]" />
      </div>

      <div className="mb-10 animate-float relative z-10 flex flex-col items-center">
        <h1 
          className="text-7xl font-black text-transparent bg-clip-text filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]"
          style={{ 
            backgroundImage: 'linear-gradient(to bottom, #ffffff, #a0a0a0 40%, #505050 50%, #ffffff 60%)',
            WebkitTextStroke: '2px #000'
          }}
        >
          MINDI
        </h1>
        <p className="text-sm text-gray-300 mt-2 tracking-widest italic font-light">Created By Chirag</p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-6 relative z-10">
        {/* Name Input Box */}
        <div className="mb-2">
          <input 
            type="text" 
            placeholder="Enter Your Name" 
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={15}
            className="w-full text-center tracking-wide font-semibold"
            style={{
              background: 'rgba(0,0,0,0.6)',
              border: '2px solid rgba(150, 0, 0, 0.5)',
              borderRadius: '20px',
              padding: '16px',
              color: '#fff',
              fontSize: '1.2rem',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.8)'
            }}
          />
        </div>

        {/* Buttons */}
        <button className="btn-3d w-full" onClick={handleCreateGame}>
          CREATE GAME
        </button>

        {/* TEMPORARY DEBUG BUTTON */}
        <button 
          className="btn-3d w-full mb-4" 
          style={{ background: 'linear-gradient(to bottom, #880000, #550000)' }}
          onClick={() => {
            const roomId = '9999';
            const p1 = { id: 'p1', name: 'TestHost', isHost: true, team: 'A' };
            const p2 = { id: 'p2', name: 'Bot2', isHost: false, team: 'B' };
            const p3 = { id: 'p3', name: 'Bot3', isHost: false, team: 'A' };
            const p4 = { id: 'p4', name: 'Bot4', isHost: false, team: 'B' };
            const room = {
              id: roomId,
              settings: { playerCount: 4, deckCount: 52, host: 'TestHost' },
              state: 'waiting',
              hostId: 'p1',
              players: { p1, p2, p3, p4 }
            };
            localStorage.setItem('mindi_rooms', JSON.stringify({ [roomId]: room }));
            
            // We need to trigger startGame. We can just navigate to lobby and let the user click start.
            navigate(`/room/${roomId}/lobby`);
          }}
        >
          DEBUG AUTOPLAY
        </button>
        
        <button className="btn-3d w-full" onClick={handleJoinGame}>
          JOIN GAME
        </button>
      </div>
    </div>
  );
}
