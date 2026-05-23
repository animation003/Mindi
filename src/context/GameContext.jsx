import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, setDoc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const GameContext = createContext(null);

export const useGame = () => useContext(GameContext);

const CARD_VALUES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

const generateDeck = (deckMode) => {
  const suits = ['H', 'D', 'C', 'S'];
  const values = Object.keys(CARD_VALUES);
  let deck = [];
  
  const createStandardDeck = (deckIndex) => {
    let d = [];
    suits.forEach(suit => {
      values.forEach(value => {
        d.push({ id: `${value}_${suit}_${deckIndex}`, suit, value, isRed: suit === 'H' || suit === 'D' });
      });
    });
    return d;
  };

  if (deckMode === 52) {
    deck = createStandardDeck(1);
  } else if (deckMode === 104 || deckMode === 102) {
    deck = [...createStandardDeck(1), ...createStandardDeck(2)];
    if (deckMode === 102) {
      let removedH = false;
      let removedS = false;
      deck = deck.filter(card => {
        if (card.value === '2' && card.suit === 'H' && !removedH) {
          removedH = true;
          return false;
        }
        if (card.value === '2' && card.suit === 'S' && !removedS) {
          removedS = true;
          return false;
        }
        return true;
      });
    }
  }
  
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

export const GameProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('mindi_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentRoomCode, setCurrentRoomCode] = useState(null);
  const [currentRoomData, setCurrentRoomData] = useState(null);

  // Real-time listener for the active room
  useEffect(() => {
    if (!currentRoomCode) {
      setCurrentRoomData(null);
      return;
    }

    const unsub = onSnapshot(doc(db, "rooms", currentRoomCode), (docSnap) => {
      if (docSnap.exists()) {
        setCurrentRoomData(docSnap.data());
      } else {
        // Room was deleted
        setCurrentRoomCode(null);
        setCurrentRoomData(null);
      }
    });

    return () => unsub();
  }, [currentRoomCode]);

  // We keep a 'rooms' alias pointing only to the current room for compatibility with existing UI components
  const rooms = currentRoomCode && currentRoomData ? { [currentRoomCode]: currentRoomData } : {};

  const saveUser = (user) => {
    localStorage.setItem('mindi_user', JSON.stringify(user));
    setCurrentUser(user);
  };

  const createRoom = async (roomId, settings) => {
    const userId = `host_${Math.random().toString(36).substr(2, 9)}`;
    const user = { id: userId, name: settings.host, isHost: true };
    saveUser(user);
    
    const roomData = {
      id: roomId,
      settings,
      state: 'waiting',
      hostId: userId,
      players: { [userId]: { ...user, team: null } }
    };

    await setDoc(doc(db, "rooms", roomId), roomData);
    setCurrentRoomCode(roomId);
  };

  const joinRoom = async (roomId, playerName) => {
    const docRef = doc(db, "rooms", roomId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return false;
    const roomData = docSnap.data();
    
    const currentPlayers = Object.keys(roomData.players).length;
    if (currentPlayers >= roomData.settings.playerCount) return false;

    // Check if user already exists in this room via local storage to reconnect
    let user = currentUser;
    if (!user || !roomData.players[user.id]) {
      const userId = `player_${Math.random().toString(36).substr(2, 9)}`;
      user = { id: userId, name: playerName, isHost: false };
      saveUser(user);
    }

    roomData.players[user.id] = { ...user, team: null };
    await updateDoc(docRef, { players: roomData.players });
    
    setCurrentRoomCode(roomId);
    return true;
  };

  const assignTeam = async (roomId, playerId, team) => {
    if (!currentRoomData || !currentRoomData.players[playerId]) return;
    const updatedPlayers = { ...currentRoomData.players };
    updatedPlayers[playerId].team = team;
    await updateDoc(doc(db, "rooms", roomId), { players: updatedPlayers });
  };

  const removeTeam = async (roomId, playerId) => {
    if (!currentRoomData || !currentRoomData.players[playerId]) return;
    const updatedPlayers = { ...currentRoomData.players };
    updatedPlayers[playerId].team = null;
    await updateDoc(doc(db, "rooms", roomId), { players: updatedPlayers });
  };

  const startGame = async (roomId) => {
    if (!currentRoomData) return;
    const room = { ...currentRoomData };

    const players = Object.values(room.players);
    const teamA = players.filter(p => p.team === 'A');
    const teamB = players.filter(p => p.team === 'B');
    const turnOrder = [];
    for (let i = 0; i < teamA.length; i++) {
      turnOrder.push(teamA[i].id);
      turnOrder.push(teamB[i].id);
    }

    const deck = generateDeck(room.settings.deckCount);
    const cardsPerPlayer = deck.length / players.length;
    
    const dealerCards = {};
    let lowestValue = 99;
    let dealerId = turnOrder[0];
    
    const tempDeckForDealer = generateDeck(52); 
    turnOrder.forEach((pId, idx) => {
      const card = tempDeckForDealer[idx];
      dealerCards[pId] = card;
      const val = CARD_VALUES[card.value];
      if (val < lowestValue) {
        lowestValue = val;
        dealerId = pId;
      }
    });

    const dealerIdx = turnOrder.indexOf(dealerId);
    const firstTurnId = turnOrder[(dealerIdx + 1) % turnOrder.length];

    const hands = {};
    turnOrder.forEach((pId, idx) => {
      hands[pId] = deck.slice(idx * cardsPerPlayer, (idx + 1) * cardsPerPlayer);
    });

    room.state = 'picking_dealer';
    room.turnOrder = turnOrder;
    room.dealerCards = dealerCards;
    room.dealerId = dealerId;
    room.firstTurnId = firstTurnId;
    room.currentTurn = null; 
    
    room.hands = hands;
    room.trick = [];
    room.hukam = null;
    room.leadingSuit = null;
    room.scores = {
      A: { hands: 0, mindis: 0 },
      B: { hands: 0, mindis: 0 }
    };
    
    await updateDoc(doc(db, "rooms", roomId), room);
  };

  const updateGameState = async (roomId, newState) => {
    if (!currentRoomData) return;
    const updates = { state: newState };
    if (newState === 'playing') {
      updates.currentTurn = currentRoomData.firstTurnId;
    }
    await updateDoc(doc(db, "rooms", roomId), updates);
  };

  const evaluateTrickWinner = (trick, hukam) => {
    const leadingSuit = trick[0].card.suit;
    let winner = trick[0];
    let highestValue = CARD_VALUES[winner.card.value];

    const hukamCards = hukam ? trick.filter(t => t.card.suit === hukam) : [];
    
    if (hukamCards.length > 0) {
      highestValue = -1;
      hukamCards.forEach(t => {
        const val = CARD_VALUES[t.card.value];
        if (val >= highestValue) { 
          highestValue = val;
          winner = t;
        }
      });
    } else {
      trick.forEach(t => {
        if (t.card.suit === leadingSuit) {
          const val = CARD_VALUES[t.card.value];
          if (val >= highestValue) { 
            highestValue = val;
            winner = t;
          }
        }
      });
    }
    return winner;
  };

  const playCard = async (roomId, playerId, cardId) => {
    if (!currentRoomData || currentRoomData.currentTurn !== playerId || currentRoomData.trick.length >= currentRoomData.settings.playerCount) return false;
    
    const room = { ...currentRoomData };
    const hand = [...room.hands[playerId]];
    const cardIndex = hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return false;

    const selectedCard = hand[cardIndex];

    if (room.trick.length > 0) {
      const hasLeadingSuit = hand.some(c => c.suit === room.leadingSuit);
      if (hasLeadingSuit && selectedCard.suit !== room.leadingSuit) {
        return false;
      }
    }

    const [playedCard] = hand.splice(cardIndex, 1);
    room.hands[playerId] = hand; // Update the cloned hand array
    
    if (room.trick.length === 0) {
      room.leadingSuit = playedCard.suit;
    } else {
      if (playedCard.suit !== room.leadingSuit && !room.hukam) {
        room.hukam = playedCard.suit;
      }
    }

    room.trick = [...room.trick, { playerId, card: playedCard }];

    if (room.trick.length === room.settings.playerCount) {
      room.currentTurn = null; 
      const winner = evaluateTrickWinner(room.trick, room.hukam);
      const winnerTeam = room.players[winner.playerId].team;
      
      const mindisCount = room.trick.filter(t => t.card.value === '10').length;
      
      room.scores[winnerTeam].hands += 1;
      room.scores[winnerTeam].mindis += mindisCount;
      room.lastWinner = winner.playerId;
      
    } else {
      const currentIdx = room.turnOrder.indexOf(playerId);
      room.currentTurn = room.turnOrder[(currentIdx + 1) % room.turnOrder.length];
    }

    await updateDoc(doc(db, "rooms", roomId), room);
    return true;
  };

  const clearTrick = async (roomId) => {
    if (!currentRoomData || currentRoomData.trick.length < currentRoomData.settings.playerCount) return;
    
    const room = { ...currentRoomData };
    room.trick = [];
    room.leadingSuit = null;
    room.currentTurn = room.lastWinner; 
    
    const isMatchOver = Object.values(room.hands).every(hand => hand.length === 0);
    if (isMatchOver) {
      room.state = 'match_complete';
      room.currentTurn = null;
    }

    await updateDoc(doc(db, "rooms", roomId), room);
  };

  const playAgain = async (roomId) => {
    await startGame(roomId);
  };

  const changeTeams = async (roomId) => {
    if (!currentRoomData) return;
    const room = { ...currentRoomData };
    room.state = 'waiting';
    room.hands = {};
    room.trick = [];
    room.hukam = null;
    room.leadingSuit = null;
    room.scores = { A: { hands: 0, mindis: 0 }, B: { hands: 0, mindis: 0 } };
    await updateDoc(doc(db, "rooms", roomId), room);
  };

  return (
    <GameContext.Provider value={{ 
      currentUser, currentRoom: currentRoomData, 
      rooms, joinRoom, createRoom, assignTeam, removeTeam, startGame, updateGameState, playCard, clearTrick, playAgain, changeTeams, setCurrentRoomCode 
    }}>
      {children}
    </GameContext.Provider>
  );
};
