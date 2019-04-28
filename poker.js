const fs = require("fs");
const object = { players: {} };

// build object to store input data
fs.readFileSync("input.txt", { encoding: "utf8" })
  .split("\n")
  .forEach(line => {
    if (line) {
      if (!object.community) object.community = line.split(" ");
      else {
        let hand = line.split(" ");
        object.players[hand[0]] = hand.splice(1);
      }
    }
  });

// model values of hands
const values = {
  royal_flush: { score: 10000 },
  straight_flush: { score: 9000 },
  four_kind: { score: 8000 },
  full_house: { score: 7000 },
  flush: { score: 6000 },
  straight: { score: 5000 },
  three_kind: { score: 4000 },
  two_pairs: { score: 3000 },
  pair: { score: 2000 },
  high_card: { score: 1000 },
  cards: {
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    T: 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14
  },
  words: {
    10: "Ten",
    11: "Jack",
    12: "Queen",
    13: "King",
    14: "Ace",
    2: "Two",
    3: "Three",
    4: "Four",
    5: "Five",
    6: "Six",
    7: "Seven",
    8: "Eight",
    9: "Nine"
  }
};

// helper function to check the value of a hand
const scoreHand = input => {
  // model entire hand
  const hand = [];
  input.forEach(card => {
    let score = null;
    isNaN(card[0]) ? (score = values.cards[card[0]]) : (score = card[0]);
    hand.push({ card: card[0], suit: card[1], score: score });
  });

  // model parts of hand as object and arrays
  const cardsArray = [];
  const suitsArray = [];
  const cardsObject = {};
  const suitsObject = {};
  input.forEach(card => {
    if (!suitsObject[card[1]]) suitsObject[card[1]] = 1;
    else suitsObject[card[1]] = suitsObject[card[1]] + 1;
    if (!cardsObject[card[0]]) cardsObject[card[0]] = 1;
    else cardsObject[card[0]] = cardsObject[card[0]] + 1;
    cardsArray.push(values.cards[card[0]]);
    suitsArray.push(card[1]);
  });

  // check for a straight
  let straight = true;
  cardsArray.sort((a, b) => a - b);
  for (let i = 0; i < cardsArray.length - 1; i++) {
    if (cardsArray[i + 1] - cardsArray[i] !== 1) straight = false;
  }

  // check for flush
  let flush = false;
  if (Object.keys(suitsObject).length === 1) {
    flush = true;
    // check for royal flush
    if (Math.min(...cardsArray) > 9)
      return [values.royal_flush.score, "Royal Flush"];
    // check for straigh flush
    if (straight) {
      return [
        values.straight_flush.score + cardsArray.reduce((a, b) => a + b),
        `Straight Flush, ${values.words[Math.max(...cardsArray)]} High`
      ];
    }
  }

  // check for four of a kind
  let four_kind = false;
  let four_kind_card = null;
  Object.keys(cardsObject).forEach(card => {
    if (cardsObject[card] >= 4) {
      four_kind = true;
      four_kind_card = card;
    }
  });
  if (four_kind) {
    return [
      values.four_kind.score + 4 * four_kind_card,
      `Four ${values.words[three_kind_value]}`
    ];
  }

  // check for full house
  if (Object.keys(cardsObject).length === 2) {
    let three = null;
    let two = null;
    Object.keys(cardsObject).forEach(card => {
      if (cardsObject[card] === 3) three = values.cards[card];
      if (cardsObject[card] === 2) two = values.cards[card];
    });
    return [
      values.full_house.score + cardsArray.reduce((a, b) => a + b),
      `Full House, ${values.words[three]}s with ${values.words[two]}s`
    ];
  }

  // check for flush
  if (flush) {
    return [
      values.flush.score + cardsArray.reduce((a, b) => a + b),
      `Flush, ${values.words[Math.max(...cardsArray)]} High`
    ];
  }

  // check fo straight
  if (straight) {
    return [
      values.straight.score + cardsArray.reduce((a, b) => a + b),
      `Straight, ${values.words[Math.max(...cardsArray)]} High`
    ];
  }

  // check for three of a kind
  let three_kind = false;
  let three_kind_value = null;
  Object.keys(cardsObject).forEach(key => {
    if (cardsObject[key] === 3) {
      three_kind = true;
      three_kind_value = values.cards[key];
    }
  });
  if (three_kind) {
    let kicker = 0;
    cardsArray.forEach(card => {
      if (card !== three_kind_value && card !== three_kind_value)
        kicker += card;
    });
    return [
      values.three_kind.score + 10 * three_kind_value + kicker,
      `Three ${values.words[three_kind_value]}s`
    ];
  }

  // find pairs
  let pairs = [];
  Object.keys(cardsObject).forEach(key => {
    if (cardsObject[key] === 2) {
      pairs.push(values.cards[key]);
    }
  });
  pairs.sort((a, b) => b - a);

  // check for two pairs
  if (pairs.length === 2) {
    let kicker = 0;
    cardsArray.forEach(card => {
      if (card !== pairs[0] && card !== pairs[1]) kicker += card;
    });
    return [
      values.two_pairs.score + 10 * pairs[0] + 10 * pairs[1] + kicker,
      `Two ${values.words[pairs[0]]}s & Two ${values.words[pairs[1]]}s`
    ];
  }

  // check for single pair
  if (pairs.length === 1) {
    let kicker = 0;
    cardsArray.forEach(card => {
      if (card !== pairs[0] && card !== pairs[1]) kicker += card;
    });
    return [
      values.pair.score + 10 * pairs[0] + kicker,
      `Pair of ${values.words[pairs[0]]}s`
    ];
  }

  // if all else fails, return high card
  return [
    values.high_card.score + Math.max(...cardsArray),
    `High Card ${values.words[Math.max(...cardsArray)]}`
  ];
};

// function to compute all possible hands for a player
const computeAllHands = (community, hand) => {
  let allHands = [];
  // generate all hands by inserting one card
  hand.forEach(card => {
    for (let i = 0; i < 5; i++) {
      let tempHand = [...community];
      tempHand[i] = card;
      allHands.push(tempHand);
    }
  });
  // generate all hands by inserting both cards
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      if (i !== j) {
        let tempHand = [...community];
        tempHand[i] = hand[0];
        tempHand[j] = hand[1];
        allHands.push(tempHand);
      }
    }
  }
  return allHands;
};

// function to pass all players into generate hands function
let bestHands = [];
Object.keys(object.players).forEach(player => {
  let allHands = computeAllHands(object.community, object.players[player]);
  let maxScore = 0;
  let bestHand = null;
  let bestDescription = "";
  allHands.forEach(hand => {
    let [score, description] = scoreHand(hand);
    if (score > maxScore) {
      maxScore = score;
      bestHand = [...hand];
      bestDescription = description;
    }
  });
  bestHands.push({
    player: player,
    score: maxScore,
    hand: bestHand,
    description: bestDescription
  });
});

// sort best hands
bestHands.sort((a, b) => (a.score < b.score ? 1 : -1));

// log results to console
bestHands.forEach((score, index) => {
  console.log(
    `${index + 1} ${score.player} - ${score.description} (${score.hand})`
  );
});
