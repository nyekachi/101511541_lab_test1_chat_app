# Chat Application - COMP 3133 Lab Test 1

A real-time chat application built with Node.js, Express, Socket.io, and MongoDB Atlas.

## 🎯 Features

- ✅ User authentication (signup/login)
- ✅ Room-based messaging (DevOps, Makeup, Music, Sports, Travels, Girlhood)
- ✅ Real-time communication using Socket.io
- ✅ Message persistence with MongoDB
- ✅ Typing indicators
- ✅ Join/leave room functionality
- ✅ Room member list display
- ✅ Session management with localStorage

## 🛠️ Technologies Used

- **Backend**: Node.js, Express.js
- **Real-time Communication**: Socket.io
- **Database**: MongoDB Atlas
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Authentication**: bcryptjs for password hashing

## 📁 Project Structure

```
studentID_lab_test1_chat_app/
├── server.js                 # Main server file with Socket.io
├── package.json             # Dependencies and scripts
├── models/
│   ├── User.js             # User schema with password hashing
│   ├── GroupMessage.js     # Group message schema
│   └── PrivateMessage.js   # Private message schema
├── views/
│   ├── signup.html         # User registration page
│   ├── login.html          # User login page
│   ├── rooms.html          # Room selection page
│   └── chat.html           # Main chat interface
└── public/
    ├── js/
    │   └── client.js       # Client-side Socket.io logic
    └── css/
        └── style.css       # (Optional) Custom styles
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (free tier)
- Git

### Step 1: Clone the Repository
```bash
git clone <your-github-repo-url>
cd studentID_lab_test1_chat_app
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure MongoDB
1. Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (M0 Free tier)
3. Create a database user with username and password
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string from "Connect" → "Connect your application"
6. Update the `MONGODB_URI` in `server.js`:

```javascript
const MONGODB_URI = 'mongodb+srv://<username>:<password>@<cluster>.mongodb.net/chat_app?retryWrites=true&w=majority';
```

### Step 4: Start the Server
```bash
npm start
```

The application will run on `http://localhost:3000`

## 📝 Usage

### 1. Sign Up
- Navigate to `http://localhost:3000/signup`
- Enter username, first name, last name, and password
- Usernames must be unique

### 2. Login
- Navigate to `http://localhost:3000/login`
- Enter your credentials
- Session is stored in localStorage

### 3. Select a Room
- After login, you'll see the room selection page
- Choose from: DevOps, Makeup, Music, Sports, Travels, or Girlhood
- Click "Join Chat Room"

### 4. Chat
- Send messages in real-time
- See who's in the room (members list on the left)
- See when others are typing
- Click "Leave Room" to exit and select a different room

## 🗄️ Database Schemas

### User Schema
```javascript
{
  username: String (unique, required, min: 3 chars),
  firstname: String (required),
  lastname: String (required),
  password: String (hashed with bcrypt),
  createon: Date (default: current timestamp)
}
```

### GroupMessage Schema
```javascript
{
  from_user: String (required),
  room: String (enum: ['devops', 'makeup', 'music', 'sports', 'travels', 'girlhood']),
  message: String (required, max: 1000 chars),
  date_sent: Date (auto-generated)
}
```

### PrivateMessage Schema
```javascript
{
  from_user: String (required),
  to_user: String (required),
  message: String (required),
  date_sent: Date (auto-generated),
  read: Boolean (default: false)
}
```

## 🔌 Socket.io Events

### Client → Server
- `user_connected` - Initial connection with username
- `join_room` - Join a chat room
- `leave_room` - Leave the current room
- `group_message` - Send a message to the room
- `typing` - Emit typing indicator status

### Server → Client
- `user_joined` - Notify when a user joins the room
- `user_left` - Notify when a user leaves the room
- `room_history` - Send the last 50 messages from the room
- `group_message` - Broadcast new messages to all users in the room
- `user_typing` - Show typing indicator for other users
- `error` - Error notifications

## 🎨 UI Features

- **Responsive Design**: Works on desktop and mobile
- **Blue Color Scheme**: Professional gradient backgrounds
- **Real-time Updates**: Messages appear instantly
- **Member Tracking**: See who's currently in the room
- **System Messages**: "Welcome to chat app :)", join/leave notifications
- **Typing Indicators**: Know when someone is typing

## 🔒 Security Features

- Password hashing with bcrypt (10 salt rounds)
- XSS protection with HTML escaping
- Unique username validation
- Session-based authentication with localStorage

## 📦 Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.6.3",
    "socket.io": "^4.7.2",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

## 🐛 Troubleshooting

### Issue: "Cannot connect to MongoDB"
**Solution**: Check your MongoDB Atlas connection string and ensure your IP is whitelisted.

### Issue: "Port 3000 already in use"
**Solution**: Kill the process using port 3000 or change the port in `server.js`:
```bash
# Find and kill process on port 3000 (Mac/Linux)
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue: Messages not appearing
**Solution**: 
1. Check browser console for errors
2. Ensure Socket.io is connected (look for console logs)
3. Verify room names match the enum in GroupMessage schema

### Issue: "Invalid Date" showing instead of time
**Solution**: Ensure server.js is using `new Date().toISOString()` for timestamps

## 📸 Screenshots

### Room Selection Page
<img width="1512" height="982" alt="Screenshot 2026-02-11 at 7 47 29 PM" src="https://github.com/user-attachments/assets/5cd916f6-8b8b-47c3-b748-bd988ed6ad5e" />

### Chat Interface
<img width="1512" height="982" alt="Screenshot 2026-02-11 at 7 52 18 PM" src="https://github.com/user-attachments/assets/ec901052-42d8-4f99-a5e7-d8644a2e2a77" />


## 👨‍💻 Author

**Student Name**: Karen Amadi  
**Student ID**: 101511541 
**Course**: COMP 3133 - Full Stack Development  
**Lab Test**: 1  
**Date**: February 11, 2026

## 📄 License

This project is created for educational purposes as part of COMP 3133 course requirements.

## 🙏 Acknowledgments

- MongoDB Atlas for free cloud database hosting
- Socket.io for real-time communication
- Express.js for the web framework
- George Brown College - COMP 3133 Course

---
