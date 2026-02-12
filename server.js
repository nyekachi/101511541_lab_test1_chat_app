const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Import models
const User = require('./models/User');
const GroupMessage = require('./models/GroupMessage');
const PrivateMessage = require('./models/PrivateMessage');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://chatappuser:xSqbTgRcMhk7oXZE@comp3133.4ptr5cv.mongodb.net/chat_app?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Routes - Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'signup.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'chat.html'));
});

app.get('/rooms', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'rooms.html'));
});

// API Routes

// Signup Route
app.post('/api/signup', async (req, res) => {
  try {
    const { username, firstname, lastname, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }

    // Create new user
    const newUser = new User({
      username,
      firstname,
      lastname,
      password
    });

    await newUser.save();

    res.status(201).json({ 
      success: true, 
      message: 'User created successfully',
      user: {
        username: newUser.username,
        firstname: newUser.firstname,
        lastname: newUser.lastname
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error creating user' 
    });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Login successful',
      user: {
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error logging in' 
    });
  }
});

// Get room messages
app.get('/api/messages/:room', async (req, res) => {
  try {
    const { room } = req.params;
    const messages = await GroupMessage.find({ room })
      .sort({ createdAt: 1 })
      .limit(50);
    
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching messages' 
    });
  }
});

// Socket.io Connection
const activeUsers = new Map(); 

io.on('connection', (socket) => {
  console.log('🔌 New user connected:', socket.id);

  // User joins with username
  socket.on('user_connected', (username) => {
    socket.username = username;
    activeUsers.set(socket.id, { username, room: null });
    console.log(`👤 ${username} connected`);
  });

  // Join room
  socket.on('join_room', async ({ username, room }) => {
    try {
      socket.join(room);
      socket.currentRoom = room;
      
      // Update active users
      activeUsers.set(socket.id, { username, room });

      console.log(`📥 ${username} joined room: ${room}`);

      // Notify room
      socket.to(room).emit('user_joined', {
        username,
        message: `${username} has joined the room`,
        timestamp: new Date().toISOString()
      });

      // Send room history - Convert to proper format
      const messages = await GroupMessage.find({ room })
        .sort({ createdAt: 1 })
        .limit(50);
      
      const formattedMessages = messages.map(msg => ({
        from_user: msg.from_user,
        message: msg.message,
        date_sent: msg.createdAt || new Date(),
        room: msg.room
      }));
      
      socket.emit('room_history', formattedMessages);

    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  socket.on('leave_room', ({ username, room }) => {
    socket.leave(room);
    
    // Update active users
    const userData = activeUsers.get(socket.id);
    if (userData) {
      userData.room = null;
    }

    console.log(`📤 ${username} left room: ${room}`);

    socket.to(room).emit('user_left', {
      username,
      message: `${username} has left the room`,
      timestamp: new Date().toISOString()
    });
  });

  // Group message
  socket.on('group_message', async ({ username, room, message }) => {
    try {
      // Save to database
      const newMessage = new GroupMessage({
        from_user: username,
        room,
        message
      });

      await newMessage.save();

      // Broadcast to room with correct field names
      io.to(room).emit('group_message', {
        username: username,
        room,
        message,
        timestamp: new Date().toISOString(),
        _id: newMessage._id
      });

      console.log(`💬 [${room}] ${username}: ${message}`);

    } catch (error) {
      console.error('Error sending group message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Private message
  socket.on('private_message', async ({ from_user, to_user, message }) => {
    try {
      // Save to database
      const newMessage = new PrivateMessage({
        from_user,
        to_user,
        message
      });

      await newMessage.save();

      // Find recipient socket
      const recipientSocket = Array.from(activeUsers.entries())
        .find(([id, data]) => data.username === to_user);

      if (recipientSocket) {
        // Send to recipient
        io.to(recipientSocket[0]).emit('private_message', {
          from_user,
          to_user,
          message,
          date_sent: newMessage.date_sent,
          _id: newMessage._id
        });
      }

      // Send confirmation to sender
      socket.emit('private_message', {
        from_user,
        to_user,
        message,
        date_sent: newMessage.date_sent,
        _id: newMessage._id
      });

      console.log(`📧 ${from_user} → ${to_user}: ${message}`);

    } catch (error) {
      console.error('Error sending private message:', error);
      socket.emit('error', { message: 'Failed to send private message' });
    }
  });

  // Typing indicator
  socket.on('typing', ({ username, room, isTyping }) => {
    socket.to(room).emit('user_typing', { username, isTyping });
  });

  // Disconnect
  socket.on('disconnect', () => {
    const userData = activeUsers.get(socket.id);
    
    if (userData && userData.room) {
      socket.to(userData.room).emit('user_left', {
        username: userData.username,
        message: `${userData.username} has disconnected`,
        timestamp: new Date().toISOString()
      });
    }

    activeUsers.delete(socket.id);
    console.log('🔌 User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});