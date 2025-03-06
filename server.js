// server.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb+srv://jinangs47:pass1234@cluster0.o7tzg.mongodb.net/tailor?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('Failed to connect to MongoDB', err));

/* =======================
   CUSTOMER SECTION
========================== */

// Counter for generating custom customer IDs
const customerCounterSchema = new mongoose.Schema({
  prefix: { type: String, required: true, unique: true },
  value: { type: Number, default: 0 }
});
const CustomerCounter = mongoose.model("CustomerCounter", customerCounterSchema);

// Customer schema and model (using custom customerId)
const customerSchema = new mongoose.Schema({
  customerId: { type: String, unique: true }, // e.g., A001, A002, ...
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
});
const Customer = mongoose.model('Customer', customerSchema, 'customer');

// Function to generate a custom customer ID based on the first letter of the name
const generateCustomerId = async (fullName) => {
  const prefix = fullName.charAt(0).toUpperCase(); // First letter of name

  // Find and update counter for this prefix
  let counter = await CustomerCounter.findOneAndUpdate(
    { prefix },
    { $inc: { value: 1 } }, // Increment counter
    { new: true, upsert: true }
  );

  // Generate ID (e.g., A001, A002)
  return `${prefix}${String(counter.value).padStart(3, "0")}`;
};

// Routes for customers

// Create a new customer with generated customerId
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

// Get a customer by ID
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

// Update a customer
app.put('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  const { fullName, gender, phoneNumber, gmail, dob, address, waist, chest, shoulders, hips, length, armhole } = req.body;
  try {
    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      { fullName, gender, phoneNumber, gmail, dob, address, waist, chest, shoulders, hips, length, armhole },
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

// Delete a customer
app.delete('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deletedCustomer = await Customer.findByIdAndDelete(id);
    if (!deletedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

/* =======================
   ORDER SECTION
========================== */

// Counter for generating custom order IDs (based on financial year)
const orderCounterSchema = new mongoose.Schema({
  financialYear: { type: String, required: true, unique: true },
  sequence: { type: Number, default: 0 }
});
const OrderCounter = mongoose.model('OrderCounter', orderCounterSchema, 'counters');

// Order schema and model
const orderSchema = new mongoose.Schema({
  _id: String, // Custom order ID in format "1/2024-25"
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

// Function to get the current financial year (April to March)
const getFinancialYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // January is 0
  return month >= 4 ? `${year}-${year + 1 - 2000}` : `${year - 1}-${year - 2000}`;
};

// Create a new order
app.post('/api/orders', async (req, res) => {
  try {
    const { measurements, description, totalAmount, advancePaid, paymentMethod, isEmbroidery, embroidery, deliveryDate, images, customerName, mobileNumber, outfitType, customerId, isUrgent } = req.body;
    const financialYear = getFinancialYear();

    // Atomically increment the sequence for this financial year
    const counter = await OrderCounter.findOneAndUpdate(
      { financialYear },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true }
    );

    // Generate custom order ID (e.g., "1/2024-25")
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

// Get all orders (optionally filter by status)
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

// Get an order by ID
app.get('/api/orders/:id', async (req, res) => {
  const orderId = req.params.id;
  try {
    const order = await Order.findOne({ _id: orderId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Update an order (only updating status here)
app.put('/api/orders/:id', async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
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

// Delete an order
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

/* ====================================
   ADDITIONAL OUTFIT SELECTION ROUTES
   (For create-order-select-outfit endpoints)
======================================= */

// These routes fetch customer details by ID (to select an outfit)
app.get('/create-order-select-outfit/:id/blouse', async (req, res) => {
  const { id } = req.params;
  console.log('Fetching blouse details for ID:', id);
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }
  try {
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Details not found for the given ID' });
    }
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

app.get('/create-order-select-outfit/:id/pant', async (req, res) => {
  const { id } = req.params;
  console.log('Fetching pant details for ID:', id);
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }
  try {
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Details not found for the given ID' });
    }
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

app.get('/create-order-select-outfit/:id/shirt', async (req, res) => {
  const { id } = req.params;
  console.log('Fetching shirt details for ID:', id);
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }
  try {
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Details not found for the given ID' });
    }
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

app.get('/create-order-select-outfit/:id/kurta', async (req, res) => {
  const { id } = req.params;
  console.log('Fetching kurta details for ID:', id);
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }
  try {
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Details not found for the given ID' });
    }
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

app.get('/create-order-select-outfit/:id/indowestern', async (req, res) => {
  const { id } = req.params;
  console.log('Fetching indowestern details for ID:', id);
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }
  try {
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Details not found for the given ID' });
    }
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
