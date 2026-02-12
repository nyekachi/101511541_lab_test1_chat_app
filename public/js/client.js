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
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const leaveRoomButton = document.getElementById('leaveRoomButton');
const typingIndicator = document.getElementById('typingIndicator');
const membersList = document.getElementById('membersList');
const roomNameDisplay = document.getElementById('roomNameDisplay');

// Track members in room
const membersInRoom = new Set();

console.log('📋 DOM Elements:', {
    messagesContainer: !!messagesContainer,
    messageInput: !!messageInput,
    sendButton: !!sendButton,
    leaveRoomButton: !!leaveRoomButton,
    typingIndicator: !!typingIndicator,
    membersList: !!membersList,
    roomNameDisplay: !!roomNameDisplay
});

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

// Join room function
function joinRoom(room) {
    console.log('🚪 JOIN ROOM FUNCTION CALLED:', room);
    
    // Join new room
    currentRoom = room;
    socket.emit('join_room', { username: user.username, room: room });
    console.log('📤 Emitted join_room event');

    // Clear and initialize members list
    membersInRoom.clear();
    membersInRoom.add(user.username); // Add yourself first
    
    // Update room name display
    if (roomNameDisplay) {
        const displayName = room.charAt(0).toUpperCase() + room.slice(1);
        roomNameDisplay.textContent = displayName;
        console.log('✅ Room name set:', displayName);
    }
    
    if (messagesContainer) {
        messagesContainer.innerHTML = '';
        console.log('✅ Messages cleared');
    }

    updateMembersList();
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

// Socket event listeners

socket.on('user_joined', (data) => {
    console.log('📥 User joined:', data);
    membersInRoom.add(data.username);
    updateMembersList();
    addSystemMessage(`${data.username} has joined the chat`);
});

socket.on('user_left', (data) => {
    console.log('📥 User left:', data);
    membersInRoom.delete(data.username);
    updateMembersList();
    addSystemMessage(`${data.username} has left the chat`);
});

socket.on('room_history', (messages) => {
    console.log('📥 Room history received:', messages.length, 'messages');
    
    // Show welcome message
    addSystemMessage('Welcome to chat app :)');
    
    // Extract unique usernames from message history and add messages
    messages.forEach(msg => {
        if (msg.from_user) {
            membersInRoom.add(msg.from_user);
        }
        addMessage(msg.from_user, msg.message, msg.date_sent);
    });
    
    updateMembersList();
});

socket.on('group_message', (data) => {
    console.log('📥 Group message received:', data);
    
    // Add sender to members list if not already there
    if (data.username) {
        membersInRoom.add(data.username);
        updateMembersList();
    }
    
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
    messageDiv.className = `message ${username === user.username ? 'own' : ''}`;

    const messageHeader = document.createElement('div');
    messageHeader.className = 'message-header';
    messageHeader.textContent = `${escapeHtml(username)} ${formatTime(timestamp)}`;

    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    messageText.textContent = message;

    messageDiv.appendChild(messageHeader);
    messageDiv.appendChild(messageText);
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

function updateMembersList() {
    if (!membersList) return;
    
    console.log('👥 Updating members list:', Array.from(membersInRoom));
    membersList.innerHTML = '';
    
    if (membersInRoom.size === 0) {
        const li = document.createElement('li');
        li.textContent = user.username;
        membersList.appendChild(li);
    } else {
        membersInRoom.forEach(member => {
            const li = document.createElement('li');
            li.textContent = member;
            membersList.appendChild(li);
        });
    }
}

console.log('✅ CLIENT.JS FULLY LOADED AND INITIALIZED');