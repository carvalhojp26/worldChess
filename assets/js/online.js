
import { Chess } from '../public/chess.js/dist/esm/chess.js'; 

var socket = io();
var board = null
var game = new Chess()
var $status = $('#status')
var $fen = $('#fen')
var $pgn = $('#pgn')   
let gameCode =  null;
var playerColor = null

function onDragStart (source, piece, position, orientation) {
    // do not pick up pieces if the game is over
    if (game.isGameOver()) return false
    
    if ((playerColor === 'black' && piece.search(/^w/) !== -1) || (playerColor === 'white' && piece.search(/^b/) !== -1)) {
        return false;
    }

    // only pick up pieces for the side to move
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
    (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false
    }
}

function onDrop(source, target) {
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    });

    if (move === null) return 'snapback'; // illegal move
    else {
        socket.emit('move', { code: gameCode, move: move });
    }

    updateStatus();
}

socket.on('move', function(data) {
    if (data && data.move) {
        game.move(data.move);
        board.position(game.fen());
        updateStatus();
    } else {
        console.error("invalid or incomplete move:", data);
    }
});

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
    board.position(game.fen())
}

function updateStatus () {
    var status = ''
    
    var moveColor = 'White'
    if (game.turn() === 'b') {
        moveColor = 'Black'
    }
    
    // checkmate?
    if (game.isCheckmate()) {
        status = 'Game over, ' + moveColor + ' is in checkmate.'
    }
    
    // draw?
    else if (game.isDraw()) {
        status = 'Game over, drawn position'
    }
    
    // game still on
    else {
        status = moveColor + ' to move'
        
        // check?
        if (game.isCheck()) {
            status += ', ' + moveColor + ' is in check'
        }
    }
    
    $status.html(status)
    $fen.html(game.fen())
    $pgn.html(game.pgn())
}

updateStatus()  

var config = {
    position: 'start',
    pieceTheme: '../public/chessboardjs-1.0.0/img/chesspieces/wikipedia/{piece}.png',
    draggable: true,
    dropOffBoard: 'snapback',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
};

    board = Chessboard('gameBoard', config);

    function createGame(code) {
        socket.emit('createGame', {code: code});
    }
    

    function joinGame(code) {
        if(code) {
            socket.emit('joinGame', { code: code });
        } else {
            console.log('Please enter a game code.');
        }
    }

    socket.on('gameCreated', (data) => {
        console.log('Game created with code:', data.code);
        playerColor = 'white';
        gameCode = data.code;
    });

    socket.on('gameJoined', (data) => {
        console.log('Joined game with code:', data.code);
        board.flip();
        playerColor = 'black'; 
        gameCode = data.code;
    });

$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const action = urlParams.get('action');

    if (action === 'create') {
        createGame(code);
        document.getElementById('gameID').textContent = code;
    } else if (action === 'join') {
        joinGame(code);
        document.getElementById('gameID').textContent = code;
    }
});