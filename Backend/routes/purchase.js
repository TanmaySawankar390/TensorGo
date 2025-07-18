const express = require('express');
const nodemailer = require('nodemailer');
const { auth } = require('../middleware/auth');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const User = require('../models/User');

const router = express.Router();

let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('Stripe secret key not found. Payment functionality will be limited.');
}

let transporter;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
} else {
  console.warn('Email credentials not found. Email notifications will be disabled.');
}

router.get('/my-orders', auth, async (req, res) => {
  try {
    const purchases = await Purchase.find({ userId: req.user._id })
      .populate('productId', 'name description price imageUrl')
      .sort({ createdAt: -1 });

    res.json(purchases);
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Payment system not configured' });
    }

    const { productId } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: product.price * 100,
      currency: 'usd',
      metadata: {
        productId: product._id.toString(),
        userId: req.user._id.toString()
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ message: 'Payment processing failed' });
  }
});

router.post('/confirm', auth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Payment system not configured' });
    }

    const { paymentIntentId, productId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    const product = await Product.findById(productId);
    const user = await User.findById(req.user._id);

    if (!product || !user) {
      return res.status(404).json({ message: 'Product or user not found' });
    }

    const purchase = new Purchase({
      userId: req.user._id,
      productId,
      paymentStatus: 'completed',
      amount: product.price,
      stripePaymentId: paymentIntentId
    });

    await purchase.save();

    if (transporter) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL || 'admin@example.com',
        subject: 'New Purchase Notification',
        html: `
          <h2>New Purchase Alert</h2>
          <p><strong>Product:</strong> ${product.name}</p>
          <p><strong>Buyer:</strong> ${user.name} (${user.email})</p>
          <p><strong>Amount:</strong> $${product.price}</p>
          <p><strong>Payment ID:</strong> ${paymentIntentId}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
    } else {
      console.log('Email not configured, skipping notification');
    }

    res.json({
      message: 'Purchase completed successfully',
      purchase
    });
  } catch (error) {
    console.error('Purchase confirmation error:', error);
    res.status(500).json({ message: 'Purchase confirmation failed' });
  }
});

module.exports = router;