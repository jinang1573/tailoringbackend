const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 7000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/tailor', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('Failed to connect to MongoDB', err));

// Add this after your existing schemas in orderserver.js
const counterSchema = new mongoose.Schema({
  financialYear: { type: String, required: true, unique: true },
  sequence: { type: Number, default: 0 }
});
const Counter = mongoose.model('Counter', counterSchema, 'counters');

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
}, { timestamps: true });

const Customer = mongoose.model('Customer', customerSchema, 'customers');

// Order schema and model
const orderSchema = new mongoose.Schema({
  _id: String,
  measurements: {
    length: Number,
    bottom: Number,
    kneeRound: Number,
    thighRound: Number,
    waist: Number,
  },
  description: String,
  totalAmount: Number,
  advancePaid: Number,
  paymentMethod: String,
  isEmbroidery: Boolean,
  embroidery: {
    description: String,
    budget: Number,
    images: [String],
  },
  deliveryDate: Date,
  images: [String],
  status: { type: String, default: 'active' },
  customerName: String,
  mobileNumber: String,
  outfitType: String,
  customerId: { type: String, required: true },
  isUrgent: { type: Boolean, default: false }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema, 'orders');

// API route to add new customer
app.post('/api/customers', async (req, res) => {
  const {
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
    armhole,
  } = req.body;

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
    armhole,
  });

  try {
    const savedCustomer = await newCustomer.save();
    res.status(201).json(savedCustomer);
  } catch (err) {
    res.status(400).json({ message: 'Error adding customer', error: err });
  }
});

// API route to get all customers
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (error) {
    res.status(500).send('Error fetching customers');
  }
});

// API route to get a customer by ID
app.get('/api/customers/:id', async (req, res) => {
  const customerId = req.params.id;

  try {
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// API route to update a customer
app.put('/api/customers/:id', async (req, res) => {
  const customerId = req.params.id;
  const {
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
    armhole,
  } = req.body;

  try {
    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      {
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
        armhole,
      },
      { new: true, runValidators: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json(updatedCustomer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// API route to delete a customer
app.delete('/api/customers/:id', async (req, res) => {
  const customerId = req.params.id;

  try {
    const deletedCustomer = await Customer.findByIdAndDelete(customerId);

    if (!deletedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// API route to add new order
app.post('/api/orders', async (req, res) => {
  // Function to get the current financial year (April to March)
  const getFinancialYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // January is 0
    return month >= 4 ? `${year}-${year + 1 - 2000}` : `${year - 1}-${year - 2000}`;
  };

  try {
    const {
      measurements,
      description,
      totalAmount,
      advancePaid,
      paymentMethod,
      isEmbroidery,
      embroidery,
      deliveryDate,
      images,
      customerName,
      mobileNumber,
      outfitType,
      customerId,
      isUrgent,
    } = req.body;

    // Get the current financial year
    const financialYear = getFinancialYear();

    // Atomically increment the sequence for this financial year
    const counter = await Counter.findOneAndUpdate(
      { financialYear },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true }
    );

    // Generate custom order ID in the format "1/2024-25"
    const orderId = `${counter.sequence}/${financialYear}`;

    // Create the new order with the custom ID
    const newOrder = new Order({
      _id: orderId, // Set the custom ID here
      measurements,
      description,
      totalAmount,
      advancePaid,
      paymentMethod,
      isEmbroidery,
      embroidery,
      deliveryDate: new Date(deliveryDate),
      images,
      customerName,
      mobileNumber,
      outfitType,
      customerId,
      isUrgent,
    });

    // Save the order to the database
    const savedOrder = await newOrder.save();

    // Return the saved order with the custom ID
    res.status(201).json(savedOrder);
  } catch (err) {
    // Handle errors
    res.status(400).json({ message: 'Error adding order', error: err });
  }
});

// API route to get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    const orders = await Order.find(query);
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});


// API route to get an order by ID
app.get('/api/orders/:id', async (req, res) => {
  const orderId = req.params.id;
  try {
    const order = await Order.findOne({ _id: orderId }).populate('customerId');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// API route to update an order
app.put('/api/orders/:id', async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body; // Extract only the status field

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status }, // Only update status
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});


// API route to delete an order
app.delete('/api/orders/:id', async (req, res) => {
  const orderId = req.params.id;

  try {
    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});