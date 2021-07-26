//SPDX-License-Identifier: RahulPanchal-15
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./ChessGame.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

///@title Factory for Chess games
///@author Rahul Panchal
///@notice Responsible for creating new chess game contracts and handling reward distribution
///@dev Setup Chainlink for getting current UbiquitoPrice and set rewards accordingly 
contract ChessFactory is Ownable {
    using SafeMath for uint256;

    mapping(uint256 => ChessGame) public games;
    uint256 public totalGames = 0;
    IERC20Burnable private UBIQUITO;
    uint256 private INITIAL_GAME_SUPPLY = 200;
    uint256 private WINNER_SHARE;
    uint256 private LOSER_SHARE;
    uint256 private WINNER_COIN_SHARE;
    bool private isActive = false;
    
    constructor(
        IERC20Burnable _ubiquito,
        uint256 _winnerShare,
        uint256 _loserShare,
        uint256 _winnerCoinShare
    ) 
    {
        UBIQUITO = _ubiquito;
        setRewardPercentage(_winnerShare, _loserShare, _winnerCoinShare);
    }

    ///@dev Creates new chess games
    ///@param _maxChances Maximum number of chances an address is allowed to play
    ///@param _minBid Minimum amount for the bid to play a move
    ///@param _minCoinBid Minimum amount of coins required as a bid to play a move
    ///@param _tokenPrice Price of coin in terms of wei(x if, 1 coin = x wei) 
    function createGame(
        uint16 _maxChances,
        uint256 _minBid,
        uint256 _minCoinBid,
        uint256 _tokenPrice
    )
        public onlyOwner 
    {
        require(isActive==false,"ChessFactory: A game is still in progress!");
        totalGames++;
        ChessGame game = new ChessGame(
            totalGames,
            _maxChances,
            _minBid,
            _minCoinBid,
            UBIQUITO,
            _tokenPrice,
            owner(),
            payable(address(this))
        );
        UBIQUITO.transfer(address(game), INITIAL_GAME_SUPPLY); // Supply ChessFactory with sufficient Ubiquito!!!
        games[totalGames] = game;
        isActive = true;
    }

    ///@notice Address of latest game that was created
    ///@dev Address of latest game that was created
    ///@return Address of latest game
    function getLatestGame() public view returns (address) {
        return address(games[totalGames]);
    }

    ///@dev Provide Game contracts with some coins to begin with
    ///@param _supply Amount of ERC20 coins to be supplied to Game contracts
    function setInitialGameSupply(uint256 _supply) external onlyOwner {
        INITIAL_GAME_SUPPLY = _supply;
    }

    ///@dev Set percentages for distribution of loser pool
    ///@param _winnerShare Percentage of ether that will be rewarded to winners
    ///@param _loserShare Percentage of ether that will be used for losers
    ///@param _winnerCoinShare Percentage of coins that will be rewarded to winners
    function setRewardPercentage(
        uint256 _winnerShare,
        uint256 _loserShare,
        uint256 _winnerCoinShare
    ) 
        public onlyOwner 
    {
        WINNER_SHARE = _winnerShare;
        LOSER_SHARE = _loserShare;
        WINNER_COIN_SHARE = _winnerCoinShare;
    }

    ///@dev Calculate and set rewards for a game
    ///@param _gameID Id of the game
    function setRewardFor(uint256 _gameID) public onlyOwner {
        ChessGame game = games[_gameID];
        require(
            game.GAME_RESULT() != ChessGame.Result.NA,
            "ChessFactory: Game has not ended yet!"
        );
        if (game.GAME_RESULT() == ChessGame.Result.Draw) {
            game.setReward(0, 0, 0);
        } else {
            ChessGame.Sides winner = game.WINNER();
            ChessGame.Sides loser = game.LOSER();
            uint256 loserPool = game.getPool(loser);
            uint256 loserCoins = game.getCoins(loser);
            uint256 nWinners = game.getNumberOfPlayers(winner);
            uint256 nLosers = game.getNumberOfPlayers(loser);
            uint256 winner_reward = SafeMath.div(
                loserPool * WINNER_SHARE,
                (nWinners * 100),
                "ChessFactory: Error calculating winner reward!"
            );
            uint256 winner_coin_reward = SafeMath.div(
                loserCoins * WINNER_COIN_SHARE,
                (nWinners * 100),
                "ChessFactory: Error calculating winner coin reward!"
            );
            uint256 loser_reward = SafeMath.div(
                loserPool * LOSER_SHARE,
                (nLosers * 100),
                "ChessFactory: Error calculating loser reward!"
            );
            game.setReward(winner_reward, loser_reward, winner_coin_reward);
        }
    }

    ///@dev Begins process of sending rewards to winners of a game
    ///@param _gameID Id of the game
    function rewardWinners(uint256 _gameID) public onlyOwner {
        ChessGame game = games[_gameID];
        require(
            game.GAME_RESULT() != ChessGame.Result.NA,
            "ChessFactory: Game has not ended yet!"
        );
        game.sendRewards();
        isActive = false;
    }
}
