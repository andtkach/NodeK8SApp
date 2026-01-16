const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Generate unique instance ID for this service instance
const SERVICE_INSTANCE_ID = uuidv4();

// Get service info from environment variable
const SERVICE_INFO = process.env.APP_ENV_SERVICE_INFO || 'default-service-info';

// Thread-safe in-memory customer storage
// Using Map for better performance and built-in thread safety in Node.js single-threaded event loop
const customers = new Map();

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to add custom response headers
app.use((req, res, next) => {
  res.setHeader('x-service-instance', SERVICE_INSTANCE_ID);
  res.setHeader('x-service-info', SERVICE_INFO);
  next();
});

// GET /info - Returns service instance and service info
app.get('/info', (req, res) => {
  res.json({
    'service-instance': SERVICE_INSTANCE_ID,
    'service-info': SERVICE_INFO
  });
});

// GET /customers - Get all customers
app.get('/customers', (req, res) => {
  const customerList = Array.from(customers.values());
  res.json(customerList);
});

// GET /customers/:id - Get customer by ID
app.get('/customers/:id', (req, res) => {
  const { id } = req.params;

  if (!customers.has(id)) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  res.json(customers.get(id));
});

// POST /customers - Create new customer
app.post('/customers', (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const customer = {
    id: uuidv4(),
    name,
    email
  };

  customers.set(customer.id, customer);
  res.status(201).json(customer);
});

// PUT /customers/:id - Update customer
app.put('/customers/:id', (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  if (!customers.has(id)) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const customer = {
    id,
    name,
    email
  };

  customers.set(id, customer);
  res.json(customer);
});

// DELETE /customers/:id - Delete customer
app.delete('/customers/:id', (req, res) => {
  const { id } = req.params;

  if (!customers.has(id)) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  customers.delete(id);
  res.status(204).send();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Service Instance ID: ${SERVICE_INSTANCE_ID}`);
  console.log(`Service Info: ${SERVICE_INFO}`);
});
