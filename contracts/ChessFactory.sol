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

    mapping(uint32 => ChessGame) public games;
    uint32 public totalGames = 0;
    IERC20Burnable private UBIQUITO;
    uint256 private INITIAL_GAME_SUPPLY = 2000;
    uint256 private WINNER_SHARE  = 35;
    uint256 private LOSER_SHARE = 12;
    uint256 private WINNER_COIN_SHARE = 60;
    bool public isActive = false;
    uint16 private MAX_CHANCES = 10;
    uint256 private MIN_BID = 10000000000;
    uint256 private MIN_COIN_BID = 100;
    uint256 private TOKEN_PRICE = 100000002;
    uint256 private GAS_PRICE = 5;
    
    
    constructor(
        IERC20Burnable _ubiquito
    ) 
        payable
    {
        UBIQUITO = _ubiquito;
    }

    ///@dev Creates new chess games
    function createGame(uint _gasPrice)public onlyOwner 
    {
        require(isActive==false,"ChessFactory: A game is still in progress!");
        totalGames++;
        ChessGame game = new ChessGame{value: MIN_BID*2000}(
            totalGames,
            MAX_CHANCES,
            MIN_BID,
            MIN_COIN_BID,
            UBIQUITO,
            TOKEN_PRICE,
            _gasPrice,
            WINNER_SHARE,
            WINNER_COIN_SHARE,
            LOSER_SHARE,
            payable(address(this))
        );
        games[totalGames] = game;
        isActive = true;
        GAS_PRICE = _gasPrice;
        UBIQUITO.transfer(address(game), INITIAL_GAME_SUPPLY); // Supply ChessFactory with sufficient Ubiquito!!!
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

    ///@dev Change the default parameters of the game
    ///@param _maxChances Maximum moves a single player can make
    ///@param _minBid Minimum bid a player must make in ETH
    ///@param _minCoinBid Minimum bid a player must make in COIN
    ///@param _tokenPrice Price set for 1 COIN
    ///@param _gasPrice Current average gas price (considered to reimburse last player for reward computation)
    function setGameDefaults(
        uint16 _maxChances, 
        uint256 _minBid, 
        uint256 _minCoinBid, 
        uint256 _tokenPrice,
        uint256 _gasPrice
    )
        public 
        onlyOwner 
    {
        MAX_CHANCES = _maxChances;
        MIN_BID = _minBid;
        MIN_COIN_BID = _minCoinBid;
        TOKEN_PRICE = _tokenPrice;
        GAS_PRICE = _gasPrice;
    }


    ///@dev Begins process of sending rewards to winners of a game
    ///@param _gameID Id of the game
    function gameOver(uint32 _gameID) public  {
        require(msg.sender == address(games[_gameID]), "ChessFactory: Invalid caller!");
        ChessGame game = games[_gameID];
        require(game.REWARDED() == true,
            "ChessFactory: Game has not ended yet!"
        );
        isActive = false;
    }
    
    ///@dev Kills the game contract and refunds the bids
    ///@param _gameID Id of the game
    ///@param _compute True if rewards need to be computed and False for simple refund
    function forceKill(uint32 _gameID,bool _compute) public onlyOwner {
        ChessGame game = games[_gameID];
        game.activateRewardMechanism(_compute);
        isActive = false;
    }
}