const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const dataFile = path.join(__dirname, 'data.json');
const upload = multer({ dest: 'public/uploads/' });

app.use(express.static(path.join(__dirname, 'public')));

app.post('/upload', upload.single('image'), (req, res) => {
    const filePath = `/uploads/${req.file.filename}`;
    res.json({ imagePath: filePath });
});

function readData() {
    try {
        return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    } catch (error) {
        return { rooms: {} };
    }
}

function writeData(data) {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8');
}

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('joinRoom', (room, username, userId) => {
        try {
            const data = readData();
            if (!data.rooms[room]) {
                data.rooms[room] = { messages: [], users: {} };
            }
            data.rooms[room].users[userId] = username;
            writeData(data);

            socket.join(room);
            socket.emit('previousMessages', data.rooms[room].messages);
            socket.emit('message', { sender: 'system', text: `Welcome ${username}`, time: new Date().toISOString() });
            io.to(room).emit('message', { sender: 'system', text: `${username} has joined the chat`, time: new Date().toISOString() });
            io.to(room).emit('onlineUsers', Object.values(data.rooms[room].users));
        } catch (error) {
            console.error(`Error joining room: ${error}`);
        }
    });

    socket.on('chatMessage', (room, message, username) => {
        try {
            const userMsg = { sender: username, text: message, time: new Date().toISOString() };
            const data = readData();
            if (!data.rooms[room]) {
                data.rooms[room] = { messages: [], users: {} };
            }
            data.rooms[room].messages.push(userMsg);
            writeData(data);
            io.to(room).emit('message', userMsg);

            if (message.startsWith('/bot ')) {
                const query = message.substring(5);
                axios.get(`https://www.noobs-api.000.pe/dipto/baby?text=${encodeURIComponent(query)}`)
                    .then(response => {
                        const botReply = response.data.reply;
                        const botMsg = { sender: 'bot', text: botReply, time: new Date().toISOString() };
                        data.rooms[room].messages.push(botMsg);
                        writeData(data);
                        io.to(room).emit('message', botMsg);
                    });
            }
        } catch (error) {
            console.error(`Error handling chat message: ${error}`);
        }
    });

    socket.on('imageMessage', (room, imagePath, username) => {
        try {
            const msg = { sender: username, text: imagePath, time: new Date().toISOString(), type: 'image' };
            const data = readData();
            if (!data.rooms[room]) {
                data.rooms[room] = { messages: [], users: {} };
            }
            data.rooms[room].messages.push(msg);
            writeData(data);
            io.to(room).emit('message', msg);
        } catch (error) {
            console.error(`Error handling image message: ${error}`);
        }
    });

    socket.on('getOnlineUsers', (room) => {
        try {
            const data = readData();
            if (data.rooms[room]) {
                socket.emit('onlineUsers', Object.values(data.rooms[room].users));
            }
        } catch (error) {
            console.error(`Error getting online users: ${error}`);
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
        // Optionally, handle user disconnection and update the online users list
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
