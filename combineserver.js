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

// ========== COUNTERS ==========
// Counter for customer IDs (A001, B002, etc.)
const customerCounterSchema = new mongoose.Schema({
  prefix: { type: String, required: true, unique: true },
  value: { type: Number, default: 0 },
});
const CustomerCounter = mongoose.model("CustomerCounter", customerCounterSchema);

// Counter for order IDs (1/2024-25, etc.)
const orderCounterSchema = new mongoose.Schema({
  financialYear: { type: String, required: true, unique: true },
  sequence: { type: Number, default: 0 }
});
const OrderCounter = mongoose.model("OrderCounter", orderCounterSchema, 'counters');

// ========== CUSTOMER MODEL ==========
const customerSchema = new mongoose.Schema({
  customerId: { type: String, unique: true },
  fullName: { type: String, required: true },
  gender: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  gmail: { type: String },
  dob: { type: Date, required: true },
  address: { type: String, required: true },
  waist: { type: Number, required: true },
  chest: { type: Number, required: true },
  shoulders: { type: Number, required: true },
  hips: { type: Number, required: true },
  length: { type: Number, required: true },
  armhole: { type: Number, required: true },
}, { timestamps: true });

const Customer = mongoose.model('Customer', customerSchema, 'customers');

// ========== ORDER MODEL ==========
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

// ========== CUSTOMER ROUTES ==========
const generateCustomerId = async (fullName) => {
  const prefix = fullName.charAt(0).toUpperCase();
  const counter = await CustomerCounter.findOneAndUpdate(
    { prefix },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  return `${prefix}${String(counter.value).padStart(3, "0")}`;
};

// Add customer
app.post("/api/customers", async (req, res) => {
  try {
    const { fullName, gender, phoneNumber, gmail, dob, address, waist, chest, shoulders, hips, length, armhole } = req.body;
    const customerId = await generateCustomerId(fullName);

    const newCustomer = new Customer({
      customerId,
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

    const savedCustomer = await newCustomer.save();
    res.status(201).json(savedCustomer);
  } catch (err) {
    res.status(400).json({ message: "Error adding customer", error: err });
  }
});

// Get all customers
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (error) {
    res.status(500).send('Error fetching customers');
  }
});

// Get customer by ID
app.get('/api/customers/:id', async (req, res) => {
  const customerId = req.params.id;
  try {
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Update customer
app.put('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  const { fullName, gender, phoneNumber, gmail, dob, address, waist, chest, shoulders, hips, length, armhole } = req.body;

  try {
    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      { fullName, gender, phoneNumber, gmail, dob, address, waist, chest, shoulders, hips, length, armhole },
      { new: true, runValidators: true }
    );
    if (!updatedCustomer) return res.status(404).json({ message: 'Customer not found' });
    res.status(200).json(updatedCustomer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Delete customer
app.delete('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deletedCustomer = await Customer.findByIdAndDelete(id);
    if (!deletedCustomer) return res.status(404).json({ message: 'Customer not found' });
    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// ========== ORDER ROUTES ==========
// Add order
app.post('/api/orders', async (req, res) => {
  const getFinancialYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return month >= 4 ? `${year}-${year + 1 - 2000}` : `${year - 1}-${year - 2000}`;
  };

  try {
    const { measurements, description, totalAmount, advancePaid, paymentMethod, isEmbroidery, embroidery, deliveryDate, images, customerName, mobileNumber, outfitType, customerId, isUrgent } = req.body;
    const financialYear = getFinancialYear();

    const counter = await OrderCounter.findOneAndUpdate(
      { financialYear },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true }
    );

    const orderId = `${counter.sequence}/${financialYear}`;
    const newOrder = new Order({
      _id: orderId,
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

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(400).json({ message: 'Error adding order', error: err });
  }
});

// Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status && status !== 'all') query.status = status;
    const orders = await Order.find(query);
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get order by ID
app.get('/api/orders/:id', async (req, res) => {
  const orderId = req.params.id;
  try {
    const order = await Order.findOne({ _id: orderId }).populate('customerId');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Update order status
app.put('/api/orders/:id', async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  try {
    const updatedOrder = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
    if (!updatedOrder) return res.status(404).json({ message: 'Order not found' });
    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Delete order
app.delete('/api/orders/:id', async (req, res) => {
  const orderId = req.params.id;
  try {
    const deletedOrder = await Order.findByIdAndDelete(orderId);
    if (!deletedOrder) return res.status(404).json({ message: 'Order not found' });
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// ========== OUTFIT ROUTES ==========
// Generic handler for outfit routes
const handleOutfitRoute = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid ID' });
  try {
    const customer = await Customer.findById(id);
    if (!customer) return res.status(404).json({ message: 'Details not found' });
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

app.get('/create-order-select-outfit/:id/blouse', handleOutfitRoute);
app.get('/create-order-select-outfit/:id/pant', handleOutfitRoute);
app.get('/create-order-select-outfit/:id/shirt', handleOutfitRoute);
app.get('/create-order-select-outfit/:id/kurta', handleOutfitRoute);
app.get('/create-order-select-outfit/:id/indowestern', handleOutfitRoute);

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});