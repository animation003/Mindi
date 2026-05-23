import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { Crown, User } from 'lucide-react';

export default function LobbyView() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { rooms, currentUser, assignTeam, removeTeam, startGame } = useGame();
  
  const room = rooms?.[roomId];
  
  useEffect(() => {
    // If room is picking_dealer or playing, navigate to game view
    if (room?.state === 'playing' || room?.state === 'picking_dealer') {
      navigate(`/room/${roomId}/game`);
    }
  }, [room?.state, navigate, roomId]);

  if (!room || !currentUser) {
    return <div className="text-white text-center p-10">Loading or Room Not Found...</div>;
  }

  const isHost = room.hostId === currentUser.id;
  const maxPlayers = room.settings.playerCount;
  const players = Object.values(room.players || {});
  
  const unassigned = players.filter(p => !p.team);
  const teamA = players.filter(p => p.team === 'A');
  const teamB = players.filter(p => p.team === 'B');
  
  const requiredPerTeam = maxPlayers / 2;
  const isFull = players.length === maxPlayers;
  const allAssigned = teamA.length === requiredPerTeam && teamB.length === requiredPerTeam;
  const canStart = true; // TEMPORARILY TRUE FOR DEBUGGING

  const handleAssign = (playerId, team) => {
    if (!isHost) return;
    if (team === 'A' && teamA.length >= requiredPerTeam) return;
    if (team === 'B' && teamB.length >= requiredPerTeam) return;
    assignTeam(roomId, playerId, team);
  };

  const handleRemove = (playerId) => {
    if (!isHost) return;
    removeTeam(roomId, playerId);
  };

  const handleStart = () => {
    if (canStart) {
      startGame(roomId);
    }
  };

  // Generate mock waiting slots
  const emptySlots = [];
  const emptyCount = maxPlayers - players.length;
  for (let i = 0; i < emptyCount; i++) {
    emptySlots.push(
      <div key={`empty-${i}`} className="flex items-center gap-2 p-2 bg-black/40 border border-gray-700/50 rounded-lg opacity-50">
        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
          <User size={16} className="text-gray-500" />
        </div>
        <span className="text-gray-500 italic text-sm">Waiting For Player...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-slide-up relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
        <div className="w-[800px] h-[500px] bg-red-600/30 rounded-full blur-[150px]" />
      </div>

      <h2 className="text-2xl text-gold mb-4 relative z-10 font-bold tracking-widest" style={{ color: '#d4af37' }}>
        GAME LOBBY
      </h2>

      {/* Top Bar Details */}
      <div className="flex justify-center gap-12 text-sm tracking-widest text-gray-300 mb-6 relative z-10 w-full max-w-4xl border-b border-red-900/50 pb-2">
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-500">ROOM CODE</span>
          <span className="font-bold text-white text-lg">{roomId}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-500">PLAYERS</span>
          <span className="font-bold text-white text-lg">{players.length}/{maxPlayers}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-500">DECK</span>
          <span className="font-bold text-white text-lg">{room.settings.deckCount} CARDS</span>
        </div>
      </div>

      {/* Main 3 Column Layout */}
      <div className="w-full max-w-5xl grid grid-cols-[1fr_1.5fr_1fr] gap-4 mb-6 relative z-10 landscape-compact">
        
        {/* TEAM A */}
        <div className="glass-panel flex flex-col bg-black/50 border border-red-900/50 p-4">
          <h3 className="text-center bg-gradient-to-b from-red-800 to-red-950 border border-red-500/30 rounded py-1 font-bold text-white tracking-widest mb-3 shadow-inner">TEAM A</h3>
          <div className="flex flex-col gap-2">
            {teamA.map(p => (
              <div key={p.id} className="flex justify-between items-center bg-black/60 p-2 rounded border border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center">
                    <User size={16} />
                  </div>
                  <span className="text-white text-sm font-bold">{p.name} {p.isHost && <Crown size={12} className="inline text-yellow-500 ml-1" />}</span>
                </div>
                {isHost && (
                  <button onClick={() => handleRemove(p.id)} className="bg-red-900/60 hover:bg-red-700 border border-red-500/30 text-white text-[10px] px-2 py-1 rounded">
                    X
                  </button>
                )}
              </div>
            ))}
            {teamA.length < requiredPerTeam && Array.from({length: requiredPerTeam - teamA.length}).map((_, i) => (
              <div key={`ea-${i}`} className="flex items-center gap-2 bg-black/20 p-2 rounded border border-gray-800/50 opacity-40">
                <div className="w-8 h-8 rounded-full bg-gray-800" />
                <span className="text-gray-500 text-xs">Empty Slot</span>
              </div>
            ))}
          </div>
        </div>

        {/* PLAYER LIST */}
        <div className="glass-panel flex flex-col bg-black/50 border border-red-900/50 p-4">
          <h3 className="text-center text-gray-300 font-bold tracking-widest mb-3 text-sm border-b border-gray-700 pb-2">PLAYER LIST</h3>
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[200px]">
            {unassigned.map(p => (
              <div key={p.id} className="flex justify-between items-center bg-black/60 p-2 rounded border border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                    <User size={16} />
                  </div>
                  <span className="text-white text-sm font-bold">{p.name} {p.isHost && <Crown size={12} className="inline text-yellow-500 ml-1" title="Host" />}</span>
                </div>
                {isHost ? (
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleAssign(p.id, 'A')}
                      disabled={teamA.length >= requiredPerTeam}
                      className={`text-[10px] px-2 py-1 rounded border ${teamA.length >= requiredPerTeam ? 'opacity-30 border-gray-600' : 'bg-red-900/40 border-red-500/50 hover:bg-red-800'}`}
                    >TEAM A</button>
                    <button 
                      onClick={() => handleAssign(p.id, 'B')}
                      disabled={teamB.length >= requiredPerTeam}
                      className={`text-[10px] px-2 py-1 rounded border ${teamB.length >= requiredPerTeam ? 'opacity-30 border-gray-600' : 'bg-yellow-900/40 border-yellow-500/50 hover:bg-yellow-800'}`}
                    >TEAM B</button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500 italic">Waiting for assignment</span>
                )}
              </div>
            ))}
            {emptySlots}
          </div>
        </div>

        {/* TEAM B */}
        <div className="glass-panel flex flex-col bg-black/50 border border-red-900/50 p-4">
          <h3 className="text-center bg-gradient-to-b from-yellow-800 to-yellow-950 border border-yellow-500/30 rounded py-1 font-bold text-white tracking-widest mb-3 shadow-inner">TEAM B</h3>
          <div className="flex flex-col gap-2">
            {teamB.map(p => (
              <div key={p.id} className="flex justify-between items-center bg-black/60 p-2 rounded border border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center">
                    <User size={16} />
                  </div>
                  <span className="text-white text-sm font-bold">{p.name} {p.isHost && <Crown size={12} className="inline text-yellow-500 ml-1" />}</span>
                </div>
                {isHost && (
                  <button onClick={() => handleRemove(p.id)} className="bg-red-900/60 hover:bg-red-700 border border-red-500/30 text-white text-[10px] px-2 py-1 rounded">
                    X
                  </button>
                )}
              </div>
            ))}
            {teamB.length < requiredPerTeam && Array.from({length: requiredPerTeam - teamB.length}).map((_, i) => (
              <div key={`eb-${i}`} className="flex items-center gap-2 bg-black/20 p-2 rounded border border-gray-800/50 opacity-40">
                <div className="w-8 h-8 rounded-full bg-gray-800" />
                <span className="text-gray-500 text-xs">Empty Slot</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="w-full max-w-sm relative z-10 flex flex-col gap-2">
        {isHost ? (
          <button 
            className={`btn-3d w-full ${!canStart ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
            onClick={handleStart}
            disabled={!canStart}
          >
            START GAME
          </button>
        ) : (
          <div className="text-center text-gray-400 bg-black/50 py-3 rounded-full border border-gray-700">
            Waiting for host to start game...
          </div>
        )}
      </div>

    </div>
  );
}
