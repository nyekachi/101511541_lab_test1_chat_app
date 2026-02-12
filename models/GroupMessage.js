const mongoose = require('mongoose');

const groupMessageSchema = new mongoose.Schema({
  from_user: {
    type: String,
    required: [true, 'Sender username is required'],
    trim: true
  },
  room: {
  type: String,
  required: [true, 'Room name is required'],
  trim: true,
  enum: ['devops', 'makeup', 'music', 'sports', 'travels', 'girlhood']
},
  message: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  date_sent: {
    type: String,
    default: function() {
      const now = new Date();
      return now.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  }
}, {
  timestamps: true
});

// Index forqueries by room
groupMessageSchema.index({ room: 1, date_sent: -1 });

const GroupMessage = mongoose.model('GroupMessage', groupMessageSchema);

module.exports = GroupMessage;