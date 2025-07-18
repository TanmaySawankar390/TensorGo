const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const router = express.Router();

let client;
if (process.env.GOOGLE_CLIENT_ID) {
  client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
}

router.post('/test-login', async (req, res) => {
  try {
    const { email, name } = req.body;

    const isAdmin = email === process.env.SUPER_ADMIN_EMAIL;
    
    let user = await User.findOne({ email });
    
    if (!user) {
      user = new User({
        googleId: 'test-' + Date.now(),
        email,
        name,
        profileImage: 'https://via.placeholder.com/150',
        isAdmin: isAdmin
      });
      await user.save();
    } else {
      if (isAdmin && !user.isAdmin) {
        user.isAdmin = true;
        await user.save();
      }
    }

    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Test login error:', error);
    res.status(400).json({ 
      message: 'Test login failed',
      error: error.message 
    });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    console.log('Received token for verification');
    console.log('Using Client ID:', process.env.GOOGLE_CLIENT_ID);
    
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: 'Google Client ID not configured' });
    }

    if (!client) {
      return res.status(500).json({ message: 'Google OAuth client not initialized' });
    }
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    console.log('Google user verified:', { email, name });

    const isAdmin = email === process.env.SUPER_ADMIN_EMAIL;
    console.log('Is admin email?', isAdmin, 'Email:', email, 'Admin email:', process.env.SUPER_ADMIN_EMAIL);

    let user = await User.findOne({ googleId });
    
    if (!user) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        existingUser.googleId = googleId;
        existingUser.profileImage = picture;
        existingUser.isAdmin = isAdmin;
        user = await existingUser.save();
      } else {
        user = new User({
          googleId,
          email,
          name,
          profileImage: picture,
          isAdmin: isAdmin
        });
        await user.save();
        console.log('New user created:', { email, isAdmin });
      }
    } else {
      if (isAdmin && !user.isAdmin) {
        user.isAdmin = true;
        await user.save();
        console.log('Updated user to admin:', email);
      }
    }

    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(400).json({ 
      message: 'Authentication failed',
      error: error.message 
    });
  }
});

router.get('/debug', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not Set',
    googleClientIdValue: process.env.GOOGLE_CLIENT_ID || 'Not provided',
    superAdminEmail: process.env.SUPER_ADMIN_EMAIL || 'Not set',
    jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Not Set',
    mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not Set'
  });
});

module.exports = router;