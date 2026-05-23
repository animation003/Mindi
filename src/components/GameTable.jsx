import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';

const Card = ({ suit, value, isRed, hidden, selected, onClick, disabled }) => {
  const cardStyle = {
    width: '60px',
    height: '85px',
    backgroundColor: disabled ? '#aaa' : '#fff',
    borderRadius: '8px',
    border: selected ? '2px solid #facc15' : '1px solid #ccc',
    boxShadow: selected ? '0 0 15px rgba(250,204,21,0.8)' : '0 4px 6px rgba(0,0,0,0.3)',
    position: 'relative',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transform: selected ? 'translateY(-15px)' : 'translateY(0)',
    transition: 'all 0.2s ease',
    color: isRed ? '#dc2626' : '#000',
    fontFamily: 'serif',
    fontWeight: 'bold',
    userSelect: 'none',
    opacity: disabled ? 0.5 : 1
  };

  if (hidden) {
    return (
      <div style={{
        ...cardStyle,
        background: 'repeating-linear-gradient(45deg, #003311, #003311 5px, #004d1a 5px, #004d1a 10px)',
        border: '2px solid #fff',
        opacity: 1
      }} />
    );
  }
  
  const suitSymbols = { 'H': '♥', 'D': '♦', 'C': '♣', 'S': '♠' };
  
  return (
    <div style={cardStyle} onClick={disabled ? undefined : onClick}>
      <div style={{ position: 'absolute', top: '4px', left: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1' }}>
        <span style={{ fontSize: '14px' }}>{value}</span>
        <span style={{ fontSize: '10px' }}>{suitSymbols[suit]}</span>
      </div>
      <div style={{ position: 'absolute', top: '0', left: '0', right: '0', bottom: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '24px' }}>{suitSymbols[suit]}</span>
      </div>
      <div style={{ position: 'absolute', bottom: '4px', right: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1', transform: 'rotate(180deg)' }}>
        <span style={{ fontSize: '14px' }}>{value}</span>
        <span style={{ fontSize: '10px' }}>{suitSymbols[suit]}</span>
      </div>
    </div>
  );
};

export default function GameTable() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { rooms, currentUser, playCard, clearTrick, updateGameState, playAgain, changeTeams } = useGame();
  const room = rooms?.[roomId];

  const [selectedCardId, setSelectedCardId] = useState(null);

  useEffect(() => {
    // Phase 1: Picking Dealer Animation
    if (room?.state === 'picking_dealer' && room?.hostId === currentUser?.id) {
      const timer = setTimeout(() => {
        updateGameState(roomId, 'playing');
      }, 4000); // 4 second animation
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.state]);

  useEffect(() => {
    // Trick Clearing: Only host triggers the clear to avoid race conditions, but we rely on idempotent backend
    if (room?.trick?.length === room?.settings?.playerCount && room?.hostId === currentUser?.id) {
      const timer = setTimeout(() => {
        clearTrick(roomId);
      }, 2500); // 2.5 second pause
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.trick?.length]);

  useEffect(() => {
    if (room?.state === 'waiting') {
      navigate(`/room/${roomId}/lobby`);
    }
  }, [room?.state, navigate, roomId]);

  if (!room || !currentUser) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: '#002b12' }}>Loading Game...</div>;
  }

  const turnOrder = room.turnOrder || [];
  const myIdx = turnOrder.indexOf(currentUser.id);
  const maxPlayers = room.settings.playerCount;
  const isMyTurn = room.currentTurn === currentUser.id;
  const isPlaying = room.state === 'playing';
  const isPickingDealer = room.state === 'picking_dealer';
  const isMatchComplete = room.state === 'match_complete';
  const myHand = isPlaying ? (room.hands?.[currentUser.id] || []) : [];
  
  const hasLeadingSuit = room.leadingSuit ? myHand.some(c => c.suit === room.leadingSuit) : false;

  const relativeSeats = [];
  for (let i = 0; i < maxPlayers; i++) {
    const pId = turnOrder[(myIdx + i) % maxPlayers];
    relativeSeats.push(room.players[pId]);
  }

  const handlePlayCard = async () => {
    if (!selectedCardId || !isMyTurn || !isPlaying) return;
    const success = await playCard(roomId, currentUser.id, selectedCardId);
    if (success) {
      setSelectedCardId(null);
    }
  };

  const getSeatStyle = (idx) => {
    const baseStyle = { position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 };
    if (maxPlayers === 4) {
      if (idx === 1) return { ...baseStyle, left: '5%', top: '50%', transform: 'translateY(-50%)' };
      if (idx === 2) return { ...baseStyle, top: '5%', left: '50%', transform: 'translateX(-50%)' };
      if (idx === 3) return { ...baseStyle, right: '5%', top: '50%', transform: 'translateY(-50%)' };
    } else {
      if (idx === 1) return { ...baseStyle, left: '10%', bottom: '25%' };
      if (idx === 2) return { ...baseStyle, left: '15%', top: '15%' };
      if (idx === 3) return { ...baseStyle, top: '5%', left: '50%', transform: 'translateX(-50%)' };
      if (idx === 4) return { ...baseStyle, right: '15%', top: '15%' };
      if (idx === 5) return { ...baseStyle, right: '10%', bottom: '25%' };
    }
    return baseStyle;
  };

  const getTrickStyle = (idx, isWinner) => {
    const baseStyle = { 
      position: 'absolute', 
      transition: 'all 0.5s ease',
      zIndex: isWinner ? 50 : 10,
      transform: 'scale(1)'
    };
    
    if (isWinner && room.trick.length === maxPlayers) {
        return { ...baseStyle, transform: 'scale(1.2) translateY(-10px)', boxShadow: '0 0 20px #facc15' };
    }

    if (maxPlayers === 4) {
      if (idx === 0) return { ...baseStyle, transform: 'translateY(40px) scale(0.8)' };
      if (idx === 1) return { ...baseStyle, transform: 'translateX(-50px) rotate(90deg) scale(0.8)' };
      if (idx === 2) return { ...baseStyle, transform: 'translateY(-40px) scale(0.8)' };
      if (idx === 3) return { ...baseStyle, transform: 'translateX(50px) rotate(-90deg) scale(0.8)' };
    } else {
      if (idx === 0) return { ...baseStyle, transform: 'translateY(40px) scale(0.8)' };
      if (idx === 1) return { ...baseStyle, transform: 'translateX(-40px) translateY(20px) rotate(45deg) scale(0.8)' };
      if (idx === 2) return { ...baseStyle, transform: 'translateX(-40px) translateY(-20px) rotate(135deg) scale(0.8)' };
      if (idx === 3) return { ...baseStyle, transform: 'translateY(-40px) scale(0.8)' };
      if (idx === 4) return { ...baseStyle, transform: 'translateX(40px) translateY(-20px) rotate(-135deg) scale(0.8)' };
      if (idx === 5) return { ...baseStyle, transform: 'translateX(40px) translateY(20px) rotate(-45deg) scale(0.8)' };
    }
    return baseStyle;
  };

  const renderSeat = (player, relIdx) => {
    if (!player) return null;
    const isTurn = isPlaying && room.currentTurn === player.id;
    const isDealer = isPickingDealer && room.dealerId === player.id;
    const handSize = isPlaying ? (room.hands?.[player.id]?.length || 0) : 0;
    
    return (
      <div style={getSeatStyle(relIdx)} key={player.id}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          {isDealer && (
            <div style={{ position: 'absolute', top: '-15px', background: '#facc15', color: '#000', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', zIndex: 20 }}>
              DEALER
            </div>
          )}
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.6)',
            border: isTurn ? '4px solid #39ff14' : (player.team === 'A' ? '4px solid #dc2626' : '4px solid #eab308'),
            boxShadow: isTurn ? '0 0 20px rgba(57,255,20,0.8)' : (isDealer ? '0 0 15px #facc15' : '0 4px 10px rgba(0,0,0,0.5)'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
            transform: isTurn || isDealer ? 'scale(1.15)' : 'scale(1)',
            transition: 'all 0.3s ease'
          }}>
            <span style={{ fontSize: '24px', color: '#ccc' }}>👤</span>
          </div>
          <span style={{
            background: 'rgba(0,0,0,0.8)', padding: '2px 8px', borderRadius: '12px',
            fontSize: '12px', color: '#fff', fontWeight: 'bold', marginTop: '4px',
            border: '1px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap'
          }}>
            {player.name}
          </span>
          {isPlaying && (
            <span style={{ fontSize: '10px', color: '#ddd', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '10px', marginTop: '2px' }}>
              {handSize} Cards
            </span>
          )}
        </div>
        
        {/* Opponent Card Backs / Open Dealer Card */}
        {isPlaying && (
          <div style={{ display: 'flex', marginTop: '8px', transform: 'scale(0.6)', opacity: 0.8, marginLeft: '-15px' }}>
            {Array.from({ length: Math.min(handSize, 5) }).map((_, i) => (
              <div key={i} style={{ marginLeft: i === 0 ? '0' : '-30px' }}>
                <Card hidden={true} />
              </div>
            ))}
          </div>
        )}

        {isPickingDealer && room.dealerCards && room.dealerCards[player.id] && (
          <div style={{ marginTop: '8px', transform: 'scale(0.7)' }}>
             <Card suit={room.dealerCards[player.id].suit} value={room.dealerCards[player.id].value} isRed={room.dealerCards[player.id].isRed} />
          </div>
        )}
      </div>
    );
  };

  const suitSymbols = { 'H': '♥', 'D': '♦', 'C': '♣', 'S': '♠' };
  const getHukamColor = (s) => s === 'H' || s === 'D' ? '#dc2626' : '#fff';

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative', backgroundColor: '#001a09', fontFamily: 'var(--font-main)' }}>
      
      {/* Table Background Elements */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', height: '80%', maxWidth: '1200px', border: '16px solid #3b2b18', borderRadius: '200px', boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8), 0 20px 50px rgba(0,0,0,0.9)', background: 'radial-gradient(ellipse at center, rgba(0,100,30,0.2), rgba(0,20,5,0.8))' }}>
        <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', bottom: '16px', border: '2px solid rgba(92, 74, 48, 0.4)', borderRadius: '180px' }} />
      </div>

      {/* Top HUD */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '16px', zIndex: 20, pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(220, 38, 38, 0.5)', borderRadius: '8px', padding: '8px', minWidth: '120px', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px', letterSpacing: '2px', borderBottom: '1px solid rgba(255,255,255,0.2)', width: '100%', textAlign: 'center', paddingBottom: '4px', marginBottom: '4px' }}>TEAM A</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 8px' }}>
              <span style={{ color: '#aaa' }}>HANDS</span>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>{room.scores?.A?.hands || 0}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 8px', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
              <span style={{ color: '#aaa' }}>MINDIS</span>
              <span style={{ color: '#facc15', fontWeight: 'bold' }}>{room.scores?.A?.mindis || 0}</span>
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(57, 255, 20, 0.5)', borderRadius: '8px', padding: '8px', minWidth: '100px', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ color: '#39ff14', fontWeight: 'bold', fontSize: '12px', letterSpacing: '2px', borderBottom: '1px solid rgba(57,255,20,0.3)', width: '100%', textAlign: 'center', paddingBottom: '4px', marginBottom: '4px' }}>HUKAM</span>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
             <span style={{ fontSize: '20px', color: room.hukam ? getHukamColor(room.hukam) : '#888' }}>
               {room.hukam ? suitSymbols[room.hukam] : '?'}
             </span>
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(234, 179, 8, 0.5)', borderRadius: '8px', padding: '8px', minWidth: '120px', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px', letterSpacing: '2px', borderBottom: '1px solid rgba(255,255,255,0.2)', width: '100%', textAlign: 'center', paddingBottom: '4px', marginBottom: '4px' }}>TEAM B</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 8px' }}>
              <span style={{ color: '#aaa' }}>HANDS</span>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>{room.scores?.B?.hands || 0}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 8px', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
              <span style={{ color: '#aaa' }}>MINDIS</span>
              <span style={{ color: '#facc15', fontWeight: 'bold' }}>{room.scores?.B?.mindis || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Trick Pile / Information Overlay */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
        {isPlaying ? (
          <>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
               <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '12px', letterSpacing: '2px', fontWeight: 'bold' }}>
                 {room.trick.length === maxPlayers ? 'TRICK OVER' : 'TABLE'}
               </span>
            </div>
            
            {room.trick?.map((played, i) => {
               const pIdx = turnOrder.indexOf(played.playerId);
               const relIdx = (pIdx - myIdx + maxPlayers) % maxPlayers;
               const isWinner = room.trick.length === maxPlayers && room.lastWinner === played.playerId;
               return (
                 <div key={i} style={getTrickStyle(relIdx, isWinner)}>
                   <Card suit={played.card.suit} value={played.card.value} isRed={played.card.isRed} />
                 </div>
               );
            })}
          </>
        ) : isPickingDealer ? (
          <div style={{ background: 'rgba(0,0,0,0.8)', padding: '16px', borderRadius: '16px', border: '2px solid #facc15', boxShadow: '0 0 20px rgba(250,204,21,0.5)', textAlign: 'center' }}>
            <span style={{ color: '#facc15', fontWeight: 'bold', fontSize: '18px', display: 'block', marginBottom: '8px' }}>PICKING DEALER</span>
            <span style={{ color: '#fff', fontSize: '12px' }}>Lowest card deals first!</span>
          </div>
        ) : null}
      </div>

      {/* Opponent Seats */}
      {relativeSeats.slice(1).map((player, idx) => renderSeat(player, idx + 1))}

      {/* Bottom Area: My Hand & Controls */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '16px', zIndex: 30, background: 'linear-gradient(to top, rgba(0,17,4,1) 0%, rgba(0,17,4,0) 100%)', paddingTop: '40px', pointerEvents: 'auto' }}>
        
        {isPlaying && (
          <div style={{ 
            marginBottom: '16px', padding: '4px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', 
            border: isMyTurn ? '1px solid #39ff14' : '1px solid #555',
            background: isMyTurn ? 'rgba(57,255,20,0.2)' : 'rgba(0,0,0,0.5)',
            color: isMyTurn ? '#39ff14' : '#999',
            boxShadow: isMyTurn ? '0 0 10px rgba(57,255,20,0.5)' : 'none',
            transition: 'all 0.3s ease'
          }}>
            {isMyTurn ? "YOUR TURN" : (room.trick.length === maxPlayers ? "TRICK COMPLETE" : "WAITING FOR OTHERS...")}
          </div>
        )}

        {isPickingDealer && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {room.dealerId === currentUser.id ? (
              <div style={{ color: '#facc15', fontWeight: 'bold', fontSize: '20px', marginBottom: '16px', textShadow: '0 0 10px rgba(250,204,21,0.8)' }}>
                YOU ARE THE DEALER!
              </div>
            ) : (
              <div style={{ color: '#fff', fontSize: '16px', marginBottom: '16px' }}>
                Waiting for dealer selection...
              </div>
            )}
            
            {/* Show my open dealer card */}
            {room.dealerCards && room.dealerCards[currentUser.id] && (
              <div style={{ transform: 'scale(0.9)', marginBottom: '20px' }}>
                <Card suit={room.dealerCards[currentUser.id].suit} value={room.dealerCards[currentUser.id].value} isRed={room.dealerCards[currentUser.id].isRed} />
              </div>
            )}
          </div>
        )}

        {isPlaying && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', position: 'relative', height: '120px', width: '100%', maxWidth: '600px' }}>
              {myHand.map((card, idx) => {
                const offset = (idx - (myHand.length - 1) / 2) * 20;
                const rotation = (idx - (myHand.length - 1) / 2) * 3;
                const isSelected = selectedCardId === card.id;
                
                const isValidMove = isMyTurn && room.trick.length < maxPlayers && (!hasLeadingSuit || card.suit === room.leadingSuit || room.trick.length === 0);

                return (
                  <div 
                    key={card.id} 
                    style={{ 
                      position: 'absolute',
                      transformOrigin: 'bottom center',
                      transform: `translateX(${offset}px) rotate(${rotation}deg)`,
                      zIndex: isSelected ? 50 : idx,
                      opacity: isValidMove ? 1 : 0.6,
                      filter: isValidMove ? 'none' : 'grayscale(50%)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Card 
                      suit={card.suit} 
                      value={card.value} 
                      isRed={card.isRed} 
                      selected={isSelected}
                      disabled={!isValidMove}
                      onClick={() => {
                        if (isValidMove) {
                          setSelectedCardId(card.id === selectedCardId ? null : card.id);
                        }
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <div style={{ position: 'absolute', bottom: '16px', right: '16px', zIndex: 60 }}>
              <button 
                className="btn-3d"
                style={{ 
                  padding: '12px 24px', fontSize: '14px',
                  opacity: (!selectedCardId || !isMyTurn) ? 0.4 : 1,
                  filter: (!selectedCardId || !isMyTurn) ? 'grayscale(100%)' : 'none',
                  cursor: (!selectedCardId || !isMyTurn) ? 'not-allowed' : 'pointer'
                }}
                onClick={handlePlayCard}
                disabled={!selectedCardId || !isMyTurn}
              >
                PLAY CARD
              </button>
            </div>
          </>
        )}
      </div>

      {/* Match Complete Overlay */}
      {isMatchComplete && (() => {
        const scoreA = room.scores.A;
        const scoreB = room.scores.B;
        let winnerText = "IT'S A TIE!";
        let winnerColor = "#fff";
        let glowColor = "rgba(255,255,255,0.5)";

        if (scoreA.mindis > scoreB.mindis || (scoreA.mindis === scoreB.mindis && scoreA.hands > scoreB.hands)) {
          winnerText = "TEAM A WINS!";
          winnerColor = "#dc2626";
          glowColor = "rgba(220, 38, 38, 0.8)";
        } else if (scoreB.mindis > scoreA.mindis || (scoreB.mindis === scoreA.mindis && scoreB.hands > scoreA.hands)) {
          winnerText = "TEAM B WINS!";
          winnerColor = "#facc15";
          glowColor = "rgba(250, 204, 21, 0.8)";
        }

        const isHost = room.hostId === currentUser.id;

        return (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(20,20,20,1) 0%, rgba(40,40,40,1) 100%)', 
              border: `3px solid ${winnerColor}`, 
              boxShadow: `0 0 50px ${glowColor}`, 
              padding: '40px', borderRadius: '24px', textAlign: 'center', maxWidth: '500px', width: '90%'
            }}>
              <h1 style={{ fontSize: '3rem', margin: '0 0 10px 0', color: winnerColor, textShadow: `0 0 20px ${winnerColor}`, fontFamily: 'var(--font-headings)' }}>{winnerText}</h1>
              <p style={{ color: '#ccc', marginBottom: '30px', fontSize: '1.2rem', letterSpacing: '2px' }}>MATCH COMPLETE</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '40px', gap: '20px' }}>
                <div style={{ background: 'rgba(220, 38, 38, 0.1)', padding: '15px 25px', borderRadius: '12px', border: '1px solid rgba(220, 38, 38, 0.3)' }}>
                  <h3 style={{ color: '#dc2626', margin: '0 0 10px 0', fontSize: '1.5rem' }}>TEAM A</h3>
                  <div style={{ fontSize: '1.2rem', color: '#fff' }}>Mindis: <strong style={{color: '#facc15'}}>{scoreA.mindis}</strong></div>
                  <div style={{ fontSize: '1.2rem', color: '#fff' }}>Hands: <strong>{scoreA.hands}</strong></div>
                </div>
                <div style={{ background: 'rgba(250, 204, 21, 0.1)', padding: '15px 25px', borderRadius: '12px', border: '1px solid rgba(250, 204, 21, 0.3)' }}>
                  <h3 style={{ color: '#facc15', margin: '0 0 10px 0', fontSize: '1.5rem' }}>TEAM B</h3>
                  <div style={{ fontSize: '1.2rem', color: '#fff' }}>Mindis: <strong style={{color: '#facc15'}}>{scoreB.mindis}</strong></div>
                  <div style={{ fontSize: '1.2rem', color: '#fff' }}>Hands: <strong>{scoreB.hands}</strong></div>
                </div>
              </div>

              {isHost ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <button className="btn-3d" onClick={() => playAgain(roomId)} style={{ padding: '15px', fontSize: '1.2rem', width: '100%', background: 'linear-gradient(to bottom, #39ff14, #2bb50e)', color: '#000' }}>
                    PLAY AGAIN (SAME TEAMS)
                  </button>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <button className="btn-3d" onClick={() => changeTeams(roomId)} style={{ flex: 1, padding: '12px', fontSize: '1rem', background: 'linear-gradient(to bottom, #555, #333)' }}>
                      CHANGE TEAMS
                    </button>
                    <button className="btn-3d" onClick={() => navigate('/')} style={{ flex: 1, padding: '12px', fontSize: '1rem', background: 'linear-gradient(to bottom, #dc2626, #991b1b)' }}>
                      NEW ROOM
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#888', fontStyle: 'italic', marginTop: '20px' }}>Waiting for host to make a decision...</div>
              )}
            </div>
          </div>
        );
      })()}

    </div>
  );
}
