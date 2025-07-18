const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const purchaseRoutes = require('./routes/purchase');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/admin', adminRoutes);

const Product = require('./models/Product');
const seedProducts = async () => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      const sampleProducts = [
        {
          name: 'MacBook Pro',
          description: 'Latest MacBook Pro with M1 chip',
          price: 1999,
          imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500'
        },
        {
          name: 'iPhone 15',
          description: 'Latest iPhone with advanced features',
          price: 999,
          imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500'
        },
        {
          name: 'AirPods Pro',
          description: 'Wireless earbuds with noise cancellation',
          price: 249,
          imageUrl: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=500'
        }
      ];
      
      await Product.insertMany(sampleProducts);
      console.log('Sample products added');
    }
  } catch (error) {
    console.error('Error seeding products:', error);
  }
};

seedProducts();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment check:');
  console.log('- MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
  console.log('- Google Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set');
  console.log('- Stripe Secret Key:', process.env.STRIPE_SECRET_KEY ? 'Set' : 'Not set');
  console.log('- Email User:', process.env.EMAIL_USER ? 'Set' : 'Not set');
});