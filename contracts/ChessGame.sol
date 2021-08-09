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
        Draw,
        Killed
    }

    enum Sides {
        None,
        White,
        Black
    }

    struct Player {
        Sides side;
        uint16 moves;
        uint256 bid;
        uint256 cbid;
        uint256 contribution;
    }

    struct SideStruct {
        address[] players;
        uint256 pool;
        uint256 coins;
        uint256 totalPool;
        uint256 numberOfPlayers;
        uint256 reward;
        uint256 coin_reward;
    }


    uint32 public GAME_ID;
    bool public REWARDED;
    string public FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    uint16 public MAX_CHANCES;
    uint256 public MIN_COIN_BID;
    uint256 public MIN_BID;
    uint256 public UBIQUITO_PRICE;
    Result public GAME_RESULT = Result.NA;
    Sides public WINNER = Sides.None;
    Sides public LOSER = Sides.None;
    Sides public turn = Sides.White;
    IERC20Burnable private UBIQUITO;
    address payable private CHESS_FACTORY;
    uint256 private GAS_PRICE;
    uint256 private WINNER_SHARE;
    uint256 private LOSER_SHARE;
    uint256 private WINNER_COIN_SHARE;
    mapping(address => Player) private player;
    mapping(Sides => SideStruct) private side;

    event GameResult(
        address _gameAdress,
        Result _gameResult,
        Sides _winner
    );

    event RewardedPlayers(address _gameAddress, Sides _side);

    constructor(
        uint32 _gameID,
        uint16 _maxChances,
        uint256 _minBid,
        uint256 _coinMinBid,
        IERC20Burnable _token,
        uint256 _tokenPrice,
        uint256 _gasPrice,
        uint256 _winnerShare,
        uint256 _winnerCoinShare,
        uint256 _loserShare,
        address payable _chessFactory
    ) 
        payable
    {
        GAME_ID = _gameID;
        MAX_CHANCES = _maxChances;
        MIN_BID = _minBid;
        MIN_COIN_BID = _coinMinBid;
        UBIQUITO = _token;
        WINNER_SHARE = _winnerShare;
        WINNER_COIN_SHARE = _winnerCoinShare;
        LOSER_SHARE = _loserShare;
        UBIQUITO_PRICE = _tokenPrice;
        GAS_PRICE = _gasPrice;
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

    modifier validBid(uint256 _ethBid, uint256 _coinBid) {
        require(
            _ethBid == MIN_BID || _ethBid == (MIN_BID * 5) || _ethBid == (MIN_BID * 10) || 
            _coinBid == MIN_COIN_BID || _coinBid == (MIN_COIN_BID * 5) || _coinBid == (MIN_COIN_BID * 10) ,
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
    

    ///@notice Gets the pool of a side
    ///@dev Gets the pool of a side
    ///@param _side 1:White, 2:Black
    ///@return Pool of _side
    function getPool(Sides _side) public view returns (uint256) {
        return side[_side].pool;
    }
    
    ///@notice Gets the coin pool of a side
    ///@dev Gets the coin pool of a side
    ///@param _side 1:White, 2:Black
    ///@return Coin Pool of _side
    function getCoins(Sides _side) public view returns (uint256) {
        return side[_side].coins;
    }

    ///@notice Get bids made by a player
    ///@dev Returns bid and coin bid by a player
    ///@param _player Address of player
    ///@return (bid,cbid)
    function getPlayerBids(address _player) public view returns (uint256,uint256) {
        uint256 bid = player[_player].bid;
        uint256 cbid = player[_player].cbid;
        return (bid,cbid);
    }

    ///@notice Rewards all players
    ///@dev Rewards all players and destroys the contract
    function sendRewards() private isEnded 
    {
        rewardPlayersOfSide(Sides.White);
        emit RewardedPlayers(address(this), Sides.White);
        rewardPlayersOfSide(Sides.Black);
        emit RewardedPlayers(address(this), Sides.Black);
        UBIQUITO.transfer(CHESS_FACTORY,UBIQUITO.balanceOf(address(this)));
        REWARDED = true;
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


    ///@notice Side of a player
    ///@dev Side of a player
    ///@return Side of the player
    function getPlayerSide(address _player)
        public
        view
        returns (Sides)
    {
        return player[_player].side;
    }


    ///@notice Perform a move by bidding a small amount of ether
    ///@dev Validates the move and adds data to the variables
    ///@param _result Result of the game
    ///@param _side Side which is playing
    ///@param _fen FEN string of the board after the move
    function performMove(
        Result _result,
        Sides _side,
        uint256 _coins,
        string memory _move,
        string memory _fen
    )
        public
        payable
        inProgress()
        validBid(msg.value,_coins)
        isTrueSide(_side)
        isTrueTurn(_side)
        hasChancesLeft()
    {
        FEN = _fen;
        addData(msg.sender, _side, msg.value, _coins);
        if(_coins >= MIN_COIN_BID){
            UBIQUITO.transferFrom(msg.sender, address(this), _coins);
        }
        checkResult(_result,_side);
    }

    function playerContribution(address _player) public view returns(uint256) {
        return player[_player].contribution;
    }


    ///@dev Rewards all players of the game
    ///@param _side Side
    function rewardPlayersOfSide(Sides _side) 
        internal 
    {
        uint256 recipients = getNumberOfPlayers(_side);
        uint256 sideReward = side[_side].reward;
        uint256 totalSideReward = sideReward*recipients;
        uint256 sideCoinReward = side[_side].coin_reward;
        uint256 sideTotalPool = side[_side].totalPool;
        uint8 multiplier = 0;
        if (_side==WINNER || (WINNER==Sides.None && LOSER==Sides.None)){
            multiplier=1;
        }                                                                       
        for (uint256 i = 0; i < recipients; i++) {
            address payable recipient = payable(side[_side].players[i]);
            uint256 playerBid = player[recipient].bid * multiplier;
            uint256 playerCoins = (player[recipient].cbid * multiplier) / 2;
            uint256 amount = ((totalSideReward * player[recipient].contribution).div(sideTotalPool)) + playerBid;
            uint256 coinReward = sideReward.div(UBIQUITO_PRICE) + sideCoinReward;
            uint256 totalCoins = playerCoins + coinReward;
            UBIQUITO.transfer(recipient, totalCoins);
            Address.sendValue(recipient, amount);
        }
    }
    
    ///@dev Computes the rewards for winning and losing sides
    function computeRewards() private {
        uint256 loserPool = getPool(LOSER);
        uint256 loserCoins = getCoins(LOSER);
        uint256 nWinners = getNumberOfPlayers(WINNER);
        uint256 nLosers = getNumberOfPlayers(LOSER);
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
        side[WINNER].reward = winner_reward;
        side[LOSER].reward = loser_reward;
        side[WINNER].coin_reward = winner_coin_reward;
    }
    
    ///@dev Utility function to separate out the result checking process
    ///@param _result Result of the game
    ///@param _side Side
    function checkResult(Result _result,Sides _side) private {
        if (_result == Result.NA) {
            turn = switchTeam(_side);
        } else {
            GAME_RESULT = _result;
            if (_result == Result.WinLoss) {
                WINNER = _side;
                LOSER = switchTeam(_side);
            }
            emit GameResult(
                address(this),
                GAME_RESULT,
                WINNER
            );
            player[msg.sender].bid += (100548+(44400*(side[Sides.White].numberOfPlayers+side[Sides.Black].numberOfPlayers)))*GAS_PRICE;
            activateRewardMechanism(true);
        }
    }
    
    ///@dev Compute rewards, send them and inform about game status.
    ///@param _computeReward True to compute rewards
    function activateRewardMechanism(bool _computeReward) public {
        require(GAME_RESULT!=Result.NA || msg.sender==CHESS_FACTORY,"ChessGame: Invalid Caller!");
        if(msg.sender==CHESS_FACTORY){
            GAME_RESULT = Result.Killed;
        }
        if(_computeReward){
            computeRewards();
        }
        sendRewards();
        CHESS_FACTORY.call{gas: 100000}(abi.encodeWithSignature("gameOver(uint32)",GAME_ID));
        selfdestruct(CHESS_FACTORY);
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
        side[_side].totalPool += (_bid + (_coin*UBIQUITO_PRICE));
        player[_player].contribution = ((player[_player].cbid*UBIQUITO_PRICE)+player[_player].bid);
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