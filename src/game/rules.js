const CARD_VALUES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

export const canPlayCard = (hand, cardToPlay, leadingSuit) => {
  // First trick starter or no leading suit yet
  if (!leadingSuit) return true;
  
  // If player has the leading suit
  const hasLeadingSuit = hand.some(card => card.suit === leadingSuit);
  
  // If they have it, they MUST play it
  if (hasLeadingSuit && cardToPlay.suit !== leadingSuit) {
    return false;
  }
  
  return true;
};

export const determineTrickWinner = (trickCards, leadingSuit, hukamSuit) => {
  // trickCards is an array of objects: { playerId, card: { suit, value, id }, playedAt }
  // Sorted by playedAt time (ascending) to properly determine "Sir" duplicate rule
  
  let currentWinner = trickCards[0];
  
  for (let i = 1; i < trickCards.length; i++) {
    const candidate = trickCards[i];
    const winnerCard = currentWinner.card;
    const candidateCard = candidate.card;

    // 1. Sir Rule (Duplicate exactly matches current winner, played later wins)
    if (winnerCard.suit === candidateCard.suit && winnerCard.value === candidateCard.value) {
      currentWinner = candidate;
      continue;
    }

    // 2. Hukam Suit Priority
    if (hukamSuit) {
      if (candidateCard.suit === hukamSuit && winnerCard.suit !== hukamSuit) {
        currentWinner = candidate;
        continue;
      }
      if (candidateCard.suit === hukamSuit && winnerCard.suit === hukamSuit) {
        if (CARD_VALUES[candidateCard.value] > CARD_VALUES[winnerCard.value]) {
          currentWinner = candidate;
        }
        continue;
      }
      if (winnerCard.suit === hukamSuit && candidateCard.suit !== hukamSuit) {
        continue; // Winner stays
      }
    }

    // 3. Leading Suit Priority (No Hukam involved)
    if (candidateCard.suit === leadingSuit && winnerCard.suit === leadingSuit) {
      if (CARD_VALUES[candidateCard.value] > CARD_VALUES[winnerCard.value]) {
        currentWinner = candidate;
      }
      continue;
    }

    // If candidate is off-suit and not Hukam, it cannot win against leading suit
    // So currentWinner remains.
  }

  return currentWinner.playerId;
};

export const countMindis = (trickCards) => {
  return trickCards
    .map(tc => tc.card)
    .filter(card => card.value === '10');
};
