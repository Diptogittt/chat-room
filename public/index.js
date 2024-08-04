document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const chatLog = document.getElementById('chat-log');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const imageInput = document.getElementById('image-input');
    const onlineStatus = document.getElementById('online-status');
    const overlay = document.getElementById('overlay');
    const roomInput = document.getElementById('room-input');
    const usernameInput = document.getElementById('username-input');
    const userIdInput = document.getElementById('userId-input');
    const joinButton = document.getElementById('join-button');

    let room = localStorage.getItem('room');
    let username = localStorage.getItem('username');
    let userId = localStorage.getItem('userId');

    function showOverlay() {
        overlay.style.display = 'flex';
    }

    function hideOverlay() {
        overlay.style.display = 'none';
    }

    function joinChat() {
        room = roomInput.value.trim();
        username = usernameInput.value.trim();
        userId = userIdInput.value.trim();

        if (!room || !username || !userId) {
            alert("You must provide a room, username, and user ID to join.");
            return;
        }

        localStorage.setItem('room', room);
        localStorage.setItem('username', username);
        localStorage.setItem('userId', userId);

        socket.emit('joinRoom', room, username, userId);
        hideOverlay();
    }

    if (!room || !username || !userId) {
        showOverlay();
    } else {
        socket.emit('joinRoom', room, username, userId);
    }

    joinButton.addEventListener('click', joinChat);

    sendButton.addEventListener('click', () => {
        const message = userInput.value.trim();
        if (message === '') return;

        socket.emit('chatMessage', room, message, username);
        userInput.value = '';
    });

    imageInput.addEventListener('change', () => {
        const file = imageInput.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        fetch('/upload', { method: 'POST', body: formData })
            .then(response => response.json())
            .then(data => {
                socket.emit('imageMessage', room, data.imagePath, username);
            });
    });

    socket.on('message', (msg) => {
        displayMessage(msg);
    });

    function displayMessage(msg) {
        const div = document.createElement('div');
        div.classList.add('chat-message');
        div.classList.add(msg.sender === username ? 'my-message' : 'friend-message');

        const icon = `<div class="icon"></div>`;
        const content = msg.type === 'image' ?
            `<img src="${msg.text}" class="message-image" />` :
            `<p class="message-text">${msg.text}</p>`;

        const senderClass = msg.sender === username ? 'my-sender' : 'friend-sender';
        const timeClass = msg.sender === username ? 'my-time' : 'friend-time';

        div.innerHTML = `<div>
            <span class="${senderClass}">${msg.sender}</span>
            ${icon} ${content}
            <span class="${timeClass}">${new Date(msg.time).toLocaleTimeString()}</span>
        </div>`;
        chatLog.appendChild(div);
    }

    onlineStatus.addEventListener('click', () => {
        showOnlineStatus();
    });

    function showOnlineStatus() {
        const overlay = document.createElement('div');
        overlay.classList.add('overlay');

        const infoBox = document.createElement('div');
        infoBox.classList.add('info-box');
        infoBox.innerHTML = `<h2>Room Info</h2>
            <input type="text" id="room-name" value="${room}" />
            <div class="users-online">
                <h3>Users Online</h3>
                <ul id="online-users"></ul>
            </div>
            <button id="close-button">Close</button>`;

        overlay.appendChild(infoBox);
        document.body.appendChild(overlay);

        const closeButton = document.getElementById('close-button');
        closeButton.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        socket.emit('getOnlineUsers', room);
        socket.on('onlineUsers', (users) => {
            const onlineUsersList = document.getElementById('online-users');
            onlineUsersList.innerHTML = '';
            users.forEach(user => {
                const li = document.createElement('li');
                li.textContent = user;
                onlineUsersList.appendChild(li);
            });
        });
    }

    socket.on('previousMessages', (messages) => {
        chatLog.innerHTML = '';
        messages.forEach(message => {
            displayMessage(message);
        });
    });
});
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    });
}

window.addEventListener('offline', () => {
    alert('You are offline. Some features may not be available.');
});
