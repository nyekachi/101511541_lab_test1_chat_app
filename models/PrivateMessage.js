const mongoose = require('mongoose');

const privateMessageSchema = new mongoose.Schema({
  from_user: {
    type: String,
    required: [true, 'Sender username is required'],
    trim: true
  },
  to_user: {
    type: String,
    required: [true, 'Recipient username is required'],
    trim: true
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
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for queries between two users
privateMessageSchema.index({ from_user: 1, to_user: 1, date_sent: -1 });

const PrivateMessage = mongoose.model('PrivateMessage', privateMessageSchema);

module.exports = PrivateMessage;