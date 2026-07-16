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
| Ubiquito (UBI) | [`0xEccb3e879b5Ecd5F795366B3001E4803050C91aE`](https://sepolia.etherscan.io/address/0xEccb3e879b5Ecd5F795366B3001E4803050C91aE) |
| ChessFactory | [`0xe72DFFe6Db67c8f19d2ADaE7bBede3626C172301`](https://sepolia.etherscan.io/address/0xe72DFFe6Db67c8f19d2ADaE7bBede3626C172301) |
| Latest game (at deploy) | [`0x8ce4EC4E2d29CeF4AA62F56ad12d15F6E445C54d`](https://sepolia.etherscan.io/address/0x8ce4EC4E2d29CeF4AA62F56ad12d15F6E445C54d) |

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
