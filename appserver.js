const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/tailor', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('Failed to connect to MongoDB', err));

// Customer schema and model
const customerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  gender: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  gmail: { type: String }, // Optional
  dob: { type: Date, required: true },
  address: { type: String, required: true },
  
  // Additional fields for measurements
  waist: { type: Number, required: true },
  chest: { type: Number, required: true },
  shoulders: { type: Number, required: true },
  hips: { type: Number, required: true },
  length: { type: Number, required: true },
  armhole: { type: Number, required: true },
});

// Use the `customer` collection
const Customer = mongoose.model('Customer', customerSchema, 'customer');

// API route to add new customer
app.post('/api/customers', async (req, res) => {
  const { fullName, gender, phoneNumber, gmail, dob, address, waist, chest, shoulders, hips, length, armhole } = req.body;

  const newCustomer = new Customer({
    fullName,
    gender,
    phoneNumber,
    gmail,
    dob,
    address,
    waist,
    chest,
    shoulders,
    hips,
    length,
    armhole
  });

  try {
    const savedCustomer = await newCustomer.save();
    res.status(201).json(savedCustomer);
  } catch (err) {
    res.status(400).json({ message: 'Error adding customer', error: err });
  }
});

app.get('/api/customers', async (req, res) => {
  try {
    const customers = await Customer.find(); // Fetch all customers
    res.json(customers); // Send customers as JSON response
  } catch (error) {
    res.status(500).send('Error fetching customers');
  }
});

// ... other routes ...

// Update customer details
app.put('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  const { fullName, gender, phoneNumber, gmail, dob, address } = req.body;

  try {
    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      { fullName, gender, phoneNumber, gmail, dob, address },
      { new: true, runValidators: true } // Return updated document and validate data
    );

    if (!updatedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// Delete customer
app.delete('/api/customers/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedCustomer = await Customer.findByIdAndDelete(id);

    if (!deletedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});