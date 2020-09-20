const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');

const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const botName = 'ChatCord Bot';

io.on('connection', (socket) => {

    socket.on('joinRoom', ({username, room}) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        //WELCOME CURRENT USER
        socket.emit('message', formatMessage(botName, 'Welcome to chatCord !'));

        //BROADCAST WHEN USER CONNECTS
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`));

        //SEND USERS AND ROOM INFO
        io.to(user.room).emit('roomUsers', {
            room : user.room,
            users: getRoomUsers(user.room)
        });

    });

    //LISTEN FOR CHAT MESSAGE
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    //RUNS WHEN CLIENT DISCONNECT
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));
        };

        io.to(user.room).emit('roomUsers', {
            room : user.room,
            users: getRoomUsers(user.room)
        });

    });
});

//SET STATIC FOLDER
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log('Listening on port : ' + PORT));