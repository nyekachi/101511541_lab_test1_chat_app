console.log('🚀 CLIENT.JS LOADED!');

// Get user from localStorage
const user = JSON.parse(localStorage.getItem('chatUser'));
console.log('📝 User from localStorage:', user);

// Redirect to login if not logged in
if (!user) {
    console.log('❌ No user found, redirecting to login');
    window.location.href = '/login';
}

// Check if a room was selected from the rooms page
const selectedRoom = sessionStorage.getItem('selectedRoom');
console.log('📍 Selected room from session:', selectedRoom);

// If no room selected, redirect back to rooms page
if (!selectedRoom) {
    console.log('❌ No room selected, redirecting to rooms page');
    window.location.href = '/rooms';
}

console.log('✅ User authenticated:', user.username);

const socket = io();
console.log('🔌 Socket.io initialized');

// DOM elements
const roomList = document.getElementById('roomList');
const welcomeScreen = document.getElementById('welcomeScreen');
const chatArea = document.getElementById('chatArea');
const currentRoomName = document.getElementById('currentRoomName');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const leaveRoomButton = document.getElementById('leaveRoomButton');
const usernameDisplay = document.getElementById('usernameDisplay');
const logoutButton = document.getElementById('logoutButton');
const typingIndicator = document.getElementById('typingIndicator');
const currentRoomDisplay = document.getElementById('currentRoomDisplay');

console.log('📋 DOM Elements:', {
    roomList: !!roomList,
    welcomeScreen: !!welcomeScreen,
    chatArea: !!chatArea,
    currentRoomName: !!currentRoomName,
    messagesContainer: !!messagesContainer,
    messageInput: !!messageInput,
    sendButton: !!sendButton,
    leaveRoomButton: !!leaveRoomButton,
    usernameDisplay: !!usernameDisplay,
    logoutButton: !!logoutButton,
    typingIndicator: !!typingIndicator,
    currentRoomDisplay: !!currentRoomDisplay
});

// Set username in sidebar
if (usernameDisplay) {
    usernameDisplay.textContent = user.username;
    console.log('✅ Username displayed:', user.username);
}

// Current room state
let currentRoom = null;
let typingTimeout = null;

// Emit user connected event
socket.emit('user_connected', user.username);
console.log('📤 Emitted user_connected event');

// Auto-join the selected room
if (selectedRoom) {
    console.log('🚀 Auto-joining selected room:', selectedRoom);
    setTimeout(() => {
        joinRoom(selectedRoom);
    }, 500);
}

// Room click handler (for sidebar navigation)
if (roomList) {
    roomList.addEventListener('click', (e) => {
        console.log('🖱️ Room list clicked!', e.target);
        const roomItem = e.target.closest('.room-item');
        console.log('📍 Room item:', roomItem);
        if (roomItem) {
            const room = roomItem.dataset.room;
            console.log('🚪 Switching to room:', room);
            joinRoom(room);
        }
    });
    console.log('✅ Room click handler attached');
}

// Join room function
function joinRoom(room) {
    console.log('🚪 JOIN ROOM FUNCTION CALLED:', room);
    
    // Leave current room if in one
    if (currentRoom) {
        console.log('👋 Leaving current room:', currentRoom);
        socket.emit('leave_room', { username: user.username, room: currentRoom });
    }

    // Join new room
    currentRoom = room;
    socket.emit('join_room', { username: user.username, room: room });
    console.log('📤 Emitted join_room event');

    // Update UI
    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
        console.log('✅ Welcome screen hidden');
    }
    
    if (chatArea) {
        chatArea.style.display = 'flex';
        chatArea.style.flexDirection = 'column';
        console.log('✅ Chat area shown');
    }
    
    if (leaveRoomButton) {
        leaveRoomButton.style.display = 'block';
        console.log('✅ Leave room button shown');
    }
    
    // Capitalize room name for display
    const displayName = room.charAt(0).toUpperCase() + room.slice(1);
    if (currentRoomName) {
        currentRoomName.textContent = displayName;
        console.log('✅ Room name set:', displayName);
    }
    
    if (currentRoomDisplay) {
        currentRoomDisplay.textContent = displayName;
    }
    
    if (messagesContainer) {
        messagesContainer.innerHTML = '';
        console.log('✅ Messages cleared');
    }

    // Update active room styling
    document.querySelectorAll('.room-item').forEach(item => {
        item.classList.remove('active');
    });
    const selectedRoomElement = document.querySelector(`[data-room="${room}"]`);
    if (selectedRoomElement) {
        selectedRoomElement.classList.add('active');
        console.log('✅ Active room styling applied');
    }
}

// Leave room button
if (leaveRoomButton) {
    leaveRoomButton.addEventListener('click', () => {
        console.log('🚪 Leave room button clicked');
        if (currentRoom) {
            socket.emit('leave_room', { username: user.username, room: currentRoom });
            
            // Clear session storage and redirect to rooms page
            sessionStorage.removeItem('selectedRoom');
            window.location.href = '/rooms';
        }
    });
    console.log('✅ Leave room handler attached');
}

// Send message
function sendMessage() {
    const message = messageInput.value.trim();
    console.log('💬 Send message called:', message);
    if (message && currentRoom) {
        socket.emit('group_message', {
            username: user.username,
            room: currentRoom,
            message: message
        });
        messageInput.value = '';
        console.log('📤 Message sent');
        
        // Stop typing indicator
        socket.emit('typing', {
            username: user.username,
            room: currentRoom,
            isTyping: false
        });
    }
}

// Send button click
if (sendButton) {
    sendButton.addEventListener('click', sendMessage);
    console.log('✅ Send button handler attached');
}

// Enter key to send
if (messageInput) {
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    console.log('✅ Enter key handler attached');
}

// Typing indicator
if (messageInput) {
    messageInput.addEventListener('input', () => {
        if (!currentRoom) return;

        socket.emit('typing', {
            username: user.username,
            room: currentRoom,
            isTyping: true
        });

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            socket.emit('typing', {
                username: user.username,
                room: currentRoom,
                isTyping: false
            });
        }, 1000);
    });
    console.log('✅ Typing indicator handler attached');
}

// Logout button
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        console.log('🚪 Logout clicked');
        localStorage.removeItem('chatUser');
        sessionStorage.removeItem('selectedRoom');
        window.location.href = '/login';
    });
    console.log('✅ Logout handler attached');
}

// Socket event listeners

socket.on('user_joined', (data) => {
    console.log('📥 User joined:', data);
    addSystemMessage(`${data.username} has joined the chat`);
});

socket.on('user_left', (data) => {
    console.log('📥 User left:', data);
    addSystemMessage(`${data.username} has left the chat`);
});

socket.on('room_history', (messages) => {
    console.log('📥 Room history received:', messages.length, 'messages');
    
    // Show welcome message first
    addSystemMessage('Welcome to chat app :)');
    
    // Then show message history
    messages.forEach(msg => {
        addMessage(msg.from_user, msg.message, msg.date_sent);
    });
});

socket.on('group_message', (data) => {
    console.log('📥 Group message received:', data);
    addMessage(data.username, data.message, data.timestamp);
});

socket.on('user_typing', (data) => {
    console.log('📥 User typing:', data);
    if (data.username !== user.username && typingIndicator) {
        if (data.isTyping) {
            typingIndicator.textContent = `${data.username} is typing...`;
            typingIndicator.style.display = 'block';
        } else {
            typingIndicator.style.display = 'none';
        }
    }
});

socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
    alert(error.message || 'An error occurred');
});

// Helper functions

function addMessage(username, message, timestamp) {
    console.log('💬 Adding message:', username, message);
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${username === user.username ? 'own-message' : 'other-message'}`;

    const messageHeader = document.createElement('div');
    messageHeader.className = 'message-header';
    messageHeader.innerHTML = `
        <span class="message-username">${escapeHtml(username)}</span>
        <span class="message-time">${formatTime(timestamp)}</span>
    `;

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = message;

    messageDiv.appendChild(messageHeader);
    messageDiv.appendChild(messageContent);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addSystemMessage(message) {
    console.log('📢 System message:', message);
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = message;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

console.log('✅ CLIENT.JS FULLY LOADED AND INITIALIZED');