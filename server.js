var express = require('express');
var app = express();
app.use(express.static('assets/'));
var http = require('http').Server(app);
var port = process.env.PORT || 3000;
var io = require('socket.io')(http);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

http.listen(port, function() {
    console.log('listening on *: ' + port);
});

io.on('connection', function(socket) {
    console.log('new connection');
    
    socket.on('createGame', (data) => {
        console.log(`Creating game with code: ${data.code}`);
        socket.join(data.code);
        socket.emit('gameCreated', { code: data.code });
    });

    socket.on('joinGame', (data) => {
        const room = io.sockets.adapter.rooms.get(data.code);
        if (room && room.size > 0) {
            socket.join(data.code);
            console.log(`Joining game with code: ${data.code}`);
            socket.emit('gameJoined', { code: data.code });
        } else {
            socket.emit('error', 'Game not found');
        }
    });

    socket.on('move', (data) => {
        console.log(`Movimento no jogo ${data.code}:`, data.move);

        socket.to(data.code).emit('move', data);
    });
    
});
