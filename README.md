# Bidding Chess

Bidding Chess is a crypto-based bidding game where players bid on chess moves they make. The live deployment runs on the **Sepolia** test network.

## Features

* Players bid on chess moves they make.
* The state of the chess game is available to everyone.
* Once a player makes a move, they are fixed to that side only.
* After making a move, wait for someone else to play the other side, or share the game with friends.
* If your side wins, you receive your ether bids back plus rewards from the loser pool, split between Ether and an ERC-20 token **UBI**.
* UBI tokens can also be used to play instead of Ether.

## Live app

https://rahulpanchal-15.github.io/bidding-chess

## Sepolia contracts

| Contract | Address |
|----------|---------|
| Ubiquito (UBI) | [`0xe37517f4EbE94AeF1Ad021F9cDCaFfD4d96F601b`](https://sepolia.etherscan.io/address/0xe37517f4EbE94AeF1Ad021F9cDCaFfD4d96F601b) |
| ChessFactory | [`0xD3570F455B0581493e6F7861dbf15Fb2A0d02EF5`](https://sepolia.etherscan.io/address/0xD3570F455B0581493e6F7861dbf15Fb2A0d02EF5) |
| Latest game (at deploy) | [`0x1857716a0be358CCFc2C8ddC3cAEf991972156c8`](https://sepolia.etherscan.io/address/0x1857716a0be358CCFc2C8ddC3cAEf991972156c8) |

Network ID: `11155111`

## Local development

```bash
# Terminal 1 — contracts
npx hardhat node
npm run deploy:local

# Terminal 2 — client
cd client && npm run dev
```

To target Sepolia from the Vite client, spectating uses the public Sepolia RPC by default (`https://ethereum-sepolia-rpc.publicnode.com`). No Infura key is required in the browser.

Optional override in `client/.env`:

```bash
VITE_READ_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
VITE_NETWORK_ID=11155111
```

Do **not** put private Infura/Alchemy keys in `VITE_*` variables — they are embedded in the public client bundle.

Hardhat deploys can still use Infura via root `.env` (`SEPOLIA_RPC_URL`), which never ships to the browser.

Connect MetaMask to **Sepolia** to play. If you are on the wrong network, the app shows a **Switch to Sepolia** button that calls MetaMask’s `wallet_switchEthereumChain` (and adds the chain if needed).
