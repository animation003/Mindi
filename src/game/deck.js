export const createDeck = (mode = 52) => {
  const suits = ['S', 'H', 'D', 'C'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  let deck = [];
  
  const addStandardDeck = (suffix = '') => {
    for (let suit of suits) {
      for (let value of values) {
        deck.push({
          id: `${value}-${suit}${suffix}`,
          suit,
          value,
          isRed: suit === 'H' || suit === 'D'
        });
      }
    }
  };

  addStandardDeck('-1');

  if (mode === 104 || mode === 102) {
    addStandardDeck('-2');
  }

  if (mode === 102) {
    // Remove two random 2s for 6 players
    let twosIndex = deck.map((card, index) => card.value === '2' ? index : -1).filter(i => i !== -1);
    // Shuffle the twos indices to pick random ones
    for (let i = twosIndex.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [twosIndex[i], twosIndex[j]] = [twosIndex[j], twosIndex[i]];
    }
    
    // Remove the first two in the shuffled list
    const toRemove = [twosIndex[0], twosIndex[1]].sort((a, b) => b - a);
    for (let index of toRemove) {
      deck.splice(index, 1);
    }
  }

  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
};

export const dealCards = (deck, players) => {
  const hands = {};
  const numCards = deck.length / players.length;
  
  players.forEach((player, i) => {
    hands[player.id] = deck.slice(i * numCards, (i + 1) * numCards);
  });
  
  return hands;
};
