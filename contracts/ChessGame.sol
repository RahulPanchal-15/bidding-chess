//SPDX-License-Identifier: RahulPanchal-15
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

///@title An ERC20 standard burnable token interface
///@author Rahul Panchal
interface IERC20Burnable is IERC20 {
    function burn(uint256 amount) external;
}

///@title Implements a Chess Game
///@author Rahul Panchal
///@notice Perform moves using ether or by using ERC20 token
///@dev Check for bugs 
contract ChessGame {
    using SafeMath for uint256;
    using Address for address payable;


    enum Result {
        NA,
        WinLoss,
        Draw
    }

    enum Sides {
        None,
        White,
        Black
    }

    struct Player {
        Sides side;
        // uint16 moves[MAX_CHANCES];  //can be removed
        uint16 moves;
        uint256 bid;
        uint256 cbid;
    }

    struct SideStruct {
        address[] players;
        uint256 pool;
        uint256 coins;
        uint256 numberOfPlayers;
        uint256 reward;
        uint256 coin_reward;
    }


    address payable private CHESS_FACTORY;
    bool private REWARD_SET;
    IERC20Burnable private UBIQUITO;
    string public FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    uint16 public MAX_CHANCES;
    uint256 public GAME_ID;
    uint256 public MIN_COIN_BID;
    uint256 public MIN_BID;
    uint256 public UBIQUITO_PRICE;
    Result public GAME_RESULT = Result.NA;
    Sides public WINNER = Sides.None;
    Sides public LOSER = Sides.None;
    Sides public turn = Sides.White;
    mapping(address => Player) private player;
    mapping(Sides => SideStruct) private side;

    event GameResult(
        uint256 _gameId,
        Result _gameResult,
        Sides _winner
    );

    event RewardedPlayers(uint256 _gameID, Sides _side);

    constructor(
        uint256 _gameId,
        uint16 _maxChances,
        uint256 _minBid,
        uint256 _coinMinBid,
        IERC20Burnable _token,
        uint256 _tokenPrice,
        address payable _chessFactory
    ) 
    {
        GAME_ID = _gameId;
        MAX_CHANCES = _maxChances;
        MIN_BID = _minBid;
        MIN_COIN_BID = _coinMinBid;
        UBIQUITO = _token;
        UBIQUITO_PRICE = _tokenPrice;
        CHESS_FACTORY = _chessFactory;
    }

    
    modifier isTrueSide(Sides _side) {
        Sides _actualPlayerSide = player[msg.sender].side;
        if (_actualPlayerSide == Sides.None) {
            player[msg.sender].side = _side;
            side[_side].players.push(msg.sender);
        } else {
            require(
                _actualPlayerSide == _side,
                "ChessGame: You cannot change sides!"
            );
        }
        _;
    }

    modifier validBid() {
        require(
            msg.value == MIN_BID ||
                msg.value == MIN_BID.mul(5) ||
                msg.value == MIN_BID.mul(10),
            "ChessGame: Invalid Bid!"
        );
        _;
    }

    modifier validCBid(uint256 _coins) {
        require(
            _coins == MIN_COIN_BID ||
                _coins == MIN_COIN_BID.mul(5) ||
                _coins == MIN_COIN_BID.mul(10),
            "ChessGame: Invalid Bid!"
        );
        _;
    }

    modifier onlyFactory() {
        require(
            msg.sender == CHESS_FACTORY,
            "ChessGame: Only ChessFactory can call this function!"
        );
        _;
    }

    modifier hasChancesLeft() {
        require(
            player[msg.sender].moves < MAX_CHANCES,
            "ChessGame: You have played maximum chances!"
        );
        _;
    }

    modifier isTrueTurn(Sides _side) {
        require(_side == turn, "ChessGame: Not your turn!");
        _;
    }

    modifier rewardIsSet() {
        require(REWARD_SET, "ChessGame: Reward has not been set!");
        _;
    }

    modifier inProgress() {
        require(GAME_RESULT == Result.NA, "ChessGame: Game ended!");
        _;
    }

    modifier isEnded() {
        require(GAME_RESULT != Result.NA, "ChessGame: Game in Progress!");
        _;
    }


    receive() external payable {}

    fallback() external payable {}
    
    ///@dev Used by Factory to set rewards for the game
    ///@param _winnerShare Percentage of ether that will be rewarded to winners
    ///@param _loserShare Percentage of ether that will be used for losers
    ///@param _winnerCoinShare Percentage of coins that will be rewarded to winners
    function setReward(
        uint256 _winnerShare,
        uint256 _loserShare,
        uint256 _winnerCoinShare
    )
        external 
        onlyFactory 
    {
        side[WINNER].reward = _winnerShare;
        side[LOSER].reward = _loserShare;
        side[WINNER].coin_reward = _winnerCoinShare;
        REWARD_SET = true;
    }

    ///@notice Gets the pool of a side
    ///@dev Gets the pool of a side
    ///@param _side 1:White, 2:Black
    ///@return Pool of _side
    function getPool(Sides _side) external view returns (uint256) {
        return side[_side].pool;
    }
    
    ///@notice Gets the coin pool of a side
    ///@dev Gets the coin pool of a side
    ///@param _side 1:White, 2:Black
    ///@return Coin Pool of _side
    function getCoins(Sides _side) external view returns (uint256) {
        return side[_side].coins;
    }

    ///@notice Rewards all players
    ///@dev Rewards all players and destroys the contract
    function sendRewards() external isEnded onlyFactory rewardIsSet {
        rewardPlayersOfSide(Sides.White);
        emit RewardedPlayers(GAME_ID, Sides.White);
        rewardPlayersOfSide(Sides.Black);
        emit RewardedPlayers(GAME_ID, Sides.Black);
        UBIQUITO.burn(UBIQUITO.balanceOf(address(this)));
        selfdestruct(CHESS_FACTORY);
    }

    ///@notice Number of players in a side
    ///@dev Number of players in a side
    ///@param _side 1:White, 2:Black
    ///@return Number of players in _side
    function getNumberOfPlayers(Sides _side)
        public
        view
        isEnded
        returns (uint256)
    {
        return side[_side].players.length;
    }

    ///@notice FEN of the board
    ///@dev FEN of the board
    ///@return FEN string
    function getFEN() public view returns(string memory) {
        return FEN;
    }


    ///@notice Perform a move by bidding a small amount of ether
    ///@dev Validates the move and adds data to the variables
    ///@param _result Result of the game
    ///@param _side Side which is playing
    ///@param _fen FEN string of the board after the move
    function performMoveUsingEther(
        Result _result,
        Sides _side,
        string memory _fen
    )
        public
        payable
        inProgress()
        validBid()
        isTrueSide(_side)
        isTrueTurn(_side)
        hasChancesLeft()
    {
        FEN = _fen;
        addData(msg.sender, _side, msg.value, 0);
        checkResult(_result,_side);
    }

    ///@notice Perform a move by bidding ERC20 token
    ///@dev Validates the move and adds data to the variables
    ///@param _result Result of the game
    ///@param _side Side which is playing
    ///@param _coins Amount of coins given for the bid
    ///@param _fen FEN string of the board after the move
    ///@custom:requires Sender to approve contract to transfer funds
    function performMoveUsingCoin(
        Result _result,
        Sides _side,
        uint256 _coins,
        string memory _fen
    )
        public
        payable
        inProgress()
        validCBid(_coins)
        isTrueSide(_side)
        isTrueTurn(_side)
        hasChancesLeft()
    {
        FEN = _fen;
        addData(msg.sender, _side, 0, _coins);
        checkResult(_result,_side);
        // UBIQUITO.approve(address(this), _coins); // To be done via backend! Sender must approve that ChessGame can use my Ubiquito!!
        UBIQUITO.transferFrom(msg.sender, address(this), _coins);
    }

    ///@dev Rewards all players of the game
    ///@param _side Side
    function rewardPlayersOfSide(Sides _side) 
        internal 
        isEnded 
        rewardIsSet 
    {
        uint256 recipients = getNumberOfPlayers(_side);
        uint256 sideReward = side[_side].reward;
        uint256 sideCoinReward = side[_side].coin_reward;
        uint8 multiplier = 0;
        if (_side==WINNER || _side==Sides.None){
            multiplier=1;
        }
        for (uint256 i = 0; i < recipients; i++) {
            address payable recipient = payable(side[_side].players[i]);
            uint256 playerBid = player[recipient].bid * multiplier;
            uint256 amount = sideReward + playerBid;
            Address.sendValue(recipient, amount);
            uint256 playerCoins = (player[recipient].cbid * multiplier) / 2;
            uint256 coinReward = sideReward.div(UBIQUITO_PRICE) + sideCoinReward;
            uint256 totalCoins = playerCoins + coinReward;
            UBIQUITO.transfer(recipient, totalCoins);
        }
    }


    function checkResult(
        Result _result,
        Sides _side
    ) internal
    {
        if (_result == Result.NA) {
            turn = switchTeam(_side);
        } else {
            GAME_RESULT = _result;
            if (_result == Result.WinLoss) {
                WINNER = _side;
                LOSER = switchTeam(_side);
            }
            emit GameResult(
                GAME_ID,
                GAME_RESULT,
                WINNER
            );
        }
    }

    ///@dev Utility function to add data to variables after a move
    ///@param _player Address of player
    ///@param _side Side
    ///@param _bid Bid in wei
    ///@param _coin Bid in ERC20 token
    function addData(
        address _player,
        Sides _side,
        uint256 _bid,
        uint256 _coin
    ) 
        internal 
    {
        player[_player].bid += _bid;
        player[_player].cbid += _coin;
        side[_side].pool += _bid;
        side[_side].coins += _coin;
        player[_player].moves++;
    }

    ///@dev Utility function to switch sides
    ///@param _side Side 
    ///@return Opposite Side
    function switchTeam(Sides _side) internal pure returns (Sides) {
        if (_side == Sides.Black) {
            return Sides.White;
        } else {
            return Sides.Black;
        }
    }
}