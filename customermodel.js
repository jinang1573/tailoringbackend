const mongoose = require('mongoose');

// Connect to MongoDB (ensure this matches your connection string)
mongoose.connect('mongodb://localhost:27017/tailor', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log('Failed to connect to MongoDB:', err));

const customerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  gmail: {
    type: String,
    default: ''
  },
  dob: {
    type: Date,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  waist: {
    type: Number,
    required: false
  },
  chest: {
    type: Number,
    required: false
  },
  shoulders: {
    type: Number,
    required: false
  },
  hips: {
    type: Number,
    required: false
  },
  length: {
    type: Number,
    required: false
  },
  armhole: {
    type: Number,
    required: false
  }
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;

