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
mongoose.connect('mongodb://localhost:27017/tailor', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('Failed to connect to MongoDB', err));


const counterSchema = new mongoose.Schema({
  prefix: { type: String, required: true, unique: true }, // A, B, C...
  value: { type: Number, default: 0 }, // Counter for each prefix
});

const Counter = mongoose.model("Counter", counterSchema);
// Customer schema and model
const customerSchema = new mongoose.Schema({
  customerId: { type: String, unique: true }, // Custom ID (A001, A002, ...)
  fullName: { type: String, required: true },
  gender: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  gmail: { type: String }, // Optional
  dob: { type: Date, required: true },
  address: { type: String, required: true },
  waist: { type: Number, required: true },
  chest: { type: Number, required: true },
  shoulders: { type: Number, required: true },
  hips: { type: Number, required: true },
  length: { type: Number, required: true },
  armhole: { type: Number, required: true },
});


// Use the `customer` collection
const Customer = mongoose.model('Customer', customerSchema, 'customer');

const generateCustomerId = async (fullName) => {
  const prefix = fullName.charAt(0).toUpperCase(); // First letter of name

  // Find and update counter for this prefix
  let counter = await Counter.findOneAndUpdate(
    { prefix },
    { $inc: { value: 1 } }, // Increment counter
    { new: true, upsert: true } // Create if not exist
  );

  // Generate ID (e.g., A001, A002)
  return `${prefix}${String(counter.value).padStart(3, "0")}`;
};
// API route to add new customer
app.post("/api/customers", async (req, res) => {
  try {
    const { fullName, gender, phoneNumber, gmail, dob, address, waist, chest, shoulders, hips, length, armhole } =
      req.body;

    // Generate custom ID
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


app.get('/api/customers', async (req, res) => {
    try {
      const customers = await Customer.find(); // Fetch all customers
      res.json(customers); // Send customers as JSON response
    } catch (error) {
      res.status(500).send('Error fetching customers');
    }
});

app.get('/api/customers/:id', async (req, res) => {
    const customerId = req.params.id;
    
    try {
      // Find customer by ID
      const customer = await Customer.findById(customerId);
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
  
      res.status(200).json(customer);  // Send customer data as response
    } catch (error) {
      console.error('Error fetching customer:', error);
      res.status(500).json({ message: 'Server error' });
    }
});

app.get('/create-order-select-outfit/:id/blouse', async (req, res) => {
  const { id } = req.params;

  console.log('Fetching details for ID:', id);

  // Check if the ID is a valid MongoDB ObjectId
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  try {
    // Fetch the customer/order details from the database
    const customer = await Customer.findById(id); // Replace with Order model if it's order-specific
    if (!customer) {
      return res.status(404).json({ message: 'Details not found for the given ID' });
    }

    // Send the fetched details as the response
    res.status(200).json(customer);
  } catch (error) {
    console.error('Error fetching details:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

app.get('/create-order-select-outfit/:id/pant', async (req, res) => {
  const { id } = req.params;

  console.log('Fetching details for ID:', id);

  // Check if the ID is a valid MongoDB ObjectId
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  try {
    // Fetch the customer/order details from the database
    const customer = await Customer.findById(id); // Replace with Order model if it's order-specific
    if (!customer) {
      return res.status(404).json({ message: 'Details not found for the given ID' });
    }

    // Send the fetched details as the response
    res.status(200).json(customer);
  } catch (error) {
    console.error('Error fetching details:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

app.get('/create-order-select-outfit/:id/shirt', async (req, res) => {
  const { id } = req.params;

  console.log('Fetching details for ID:', id);

  // Check if the ID is a valid MongoDB ObjectId
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  try {
    // Fetch the customer/order details from the database
    const customer = await Customer.findById(id); // Replace with Order model if it's order-specific
    if (!customer) {
      return res.status(404).json({ message: 'Details not found for the given ID' });
    }

    // Send the fetched details as the response
    res.status(200).json(customer);
  } catch (error) {
    console.error('Error fetching details:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

app.get('/create-order-select-outfit/:id/kurta', async (req, res) => {
  const { id } = req.params;

  console.log('Fetching details for ID:', id);

  // Check if the ID is a valid MongoDB ObjectId
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  try {
    // Fetch the customer/order details from the database
    const customer = await Customer.findById(id); // Replace with Order model if it's order-specific
    if (!customer) {
      return res.status(404).json({ message: 'Details not found for the given ID' });
    }

    // Send the fetched details as the response
    res.status(200).json(customer);
  } catch (error) {
    console.error('Error fetching details:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

app.get('/create-order-select-outfit/:id/indowestern', async (req, res) => {
  const { id } = req.params;

  console.log('Fetching details for ID:', id);

  // Check if the ID is a valid MongoDB ObjectId
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  try {
    // Fetch the customer/order details from the database
    const customer = await Customer.findById(id); // Replace with Order model if it's order-specific
    if (!customer) {
      return res.status(404).json({ message: 'Details not found for the given ID' });
    }

    // Send the fetched details as the response
    res.status(200).json(customer);
  } catch (error) {
    console.error('Error fetching details:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

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
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});