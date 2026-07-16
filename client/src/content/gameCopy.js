import { canPlayerMove, sideLabel } from '../utils/format';

export const GAME_PITCH =
  'Anyone can drag a piece on this shared board. Bid ETH or UBI to lock the move on-chain — your first bid locks you to that color. If your side wins, you reclaim your ETH plus a cut of the other pool, paid in ETH and UBI.';

export const HOW_TO_PLAY = [
  {
    title: 'Make a move',
    detail: 'Drag a legal piece on the shared board. Anyone can take the side that is to move.',
  },
  {
    title: 'Place your bid',
    detail: 'Confirm with ETH or UBI. Your first bid locks you to that color for the rest of the game.',
  },
  {
    title: 'Confirm on-chain',
    detail: 'Approve the transaction in MetaMask. Until you bid, the move is not locked.',
  },
  {
    title: 'Invite the other side',
    detail: 'Copy the invite link and send it so someone can bid for the other color.',
  },
];

export const FAQ_ITEMS = [
  {
    id: 'network',
    question: 'Which network do I need?',
    answer:
      'Bidding Chess runs on the Sepolia Ethereum test network (chain ID 11155111). Connect MetaMask to Sepolia — the app can prompt you to switch if you are on the wrong network. You will need Sepolia ETH for gas and bids.',
  },
  {
    id: 'ubi',
    question: 'What is UBIQUITO?',
    answer:
      'UBIQUITO (UBI) is the in-game token you earn from playing. Winners receive more, but everyone can collect UBI and use it for future bids.',
  },
  {
    id: 'rewards',
    question: 'How much reward can I earn?',
    answer:
      'Returns can range from about 6% to 20% depending on your share of the winning side. Winners reclaim their ETH plus rewards from the loser pool, paid in ETH and UBIQUITO.',
  },
  {
    id: 'get-ubi',
    question: 'Where can I get UBIQUITO?',
    answer:
      'Open Get UBI on Telegram, share your wallet address for an airdrop, or earn UBI by bidding and playing.',
  },
  {
    id: 'draw',
    question: 'What if the game ends in a draw?',
    answer: 'All bids are refunded when the game ends in a draw.',
  },
];

export const TELEGRAM_URL = 'https://t.me/joinchat/8IcM5D1zIPQyNjE1';

export const TELEGRAM_CTA_LABEL = 'Get UBI on Telegram';

export const CREATOR_NAME = 'Rahul Panchal';

export const CREATOR_TWITTER_URL = 'https://twitter.com/its0kRahul';

export const CREATOR_TWITTER_HANDLE = '@its0kRahul';

export const FAQ_ASIDE_BLURB =
  'One shared board. Bid to lock a move. Win the pool with your side.';

export function buildLiveHeadline(turn) {
  return `${sideLabel(turn)} to move — bid to play it`;
}

export function buildLiveSubcopy({ connected, turn, playerSide }) {
  if (!connected) {
    return 'This is the live game. Drag a piece, connect MetaMask on Sepolia, then bid ETH or UBI to lock the move on-chain.';
  }

  if (!canPlayerMove(turn, playerSide)) {
    const yourSide = playerSide !== '0' ? sideLabel(playerSide) : null;
    if (yourSide) {
      return `You're locked to ${yourSide}. ${sideLabel(turn)} still needs a move — copy the invite below to bring someone in.`;
    }
    return `${sideLabel(turn)} still needs a move. Copy the invite below so someone can bid.`;
  }

  if (playerSide !== '0') {
    return `You play ${sideLabel(playerSide)}. Drag a piece, then pick a bid tier — your color is already locked.`;
  }

  return 'Drag a piece, then pick a bid tier. Your first bid locks you to that color for the rest of the game.';
}

export function buildInviteText({ turnSide, url }) {
  return [
    `I just locked a move on Bidding Chess.`,
    `${turnSide} is up next — bid ETH or UBI to take the turn and fight for the pool.`,
    `Jump back into the live game: ${url}`,
  ].join('\n');
}

export function buildWaitingCopy(turn) {
  return `You're waiting on ${sideLabel(turn)}. Share the invite below so someone can bid for that side.`;
}

export function buildTwitterIntentUrl({ turnSide, url }) {
  const text = buildInviteText({ turnSide, url });
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

