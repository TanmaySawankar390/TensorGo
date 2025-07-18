# TensorGo - E-Commerce Platform

## Project Overview

TensorGo is a full-stack e-commerce platform that allows users to browse products, make payments using Stripe/Razorpay, and includes a comprehensive admin dashboard. The system sends email notifications to the super admin when purchases are made.

## Key Features

- **User Authentication** - Sign in using Google OAuth
- **Product Catalog** - Browse and search for products
- **Secure Payments** - Integrated with Stripe payment gateway
- **Admin Dashboard** - Track sales, manage products, and view user purchases
- **Email Notifications** - Automatic alerts to admin when purchases are completed

## Technologies Used

### Frontend
- React.js
- CSS
- React Router for navigation

### Backend
- Node.js with Express.js
- MongoDB for database
- JWT for authentication
- Nodemailer for sending emails

### Third-party Services
- Google OAuth for authentication
- Stripe for payment processing

## Local Setup

### Prerequisites
- Node.js (v14+ recommended)
- MongoDB (local instance or MongoDB Atlas)
- npm or yarn
- Google OAuth credentials
- Stripe or Razorpay test account

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/TanmaySawankar390/TensorGo.git
   cd TensorGo
   ```

2. **Install dependencies for both frontend and backend**
   ```bash
   # Install backend dependencies
   npm install

   # Install frontend dependencies
   cd client
   npm install
   cd ..
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/tensorgo

   # JWT
   JWT_SECRET=your_jwt_secret

   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

   # Payment Gateway (Choose one)
   # For Stripe
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

   # Email Configuration
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_email_password
   ADMIN_EMAIL=admin@example.com
   SUPER_ADMIN_EMAIL=abc@gmail.com
   ```

4. **Start the development servers**
   ```bash

   # Or run them separately
   # Backend only
   npm install
   npm start

   # Frontend only
   npm install
   npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Admin Dashboard: http://localhost:3000 (login with super admin credentials set by you in ENV through email)

## Project Structure

```
TensorGo/
├── client/                 # Frontend React application
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Utility functions
│   │   └── App.js          # Main application component
├── server/                 # Backend Node.js application
│   ├── middleware/         # Custom middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   └── server.js           # Entry point
├── .env                    # Environment variables (create this)
├── .gitignore
├── package.json
└── README.md
```

## API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/logout` - Logout user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID

### Payments
- `POST /api/payments/create-checkout-session` - Create payment session
- `POST /api/payments/webhook` - Payment webhook for confirmation

### Admin
- `GET /api/admin/sales` - Get all sales data
- `GET /api/admin/users` - Get all users (admin only)

## Setting Up OAuth and Payment Gateways

### Google OAuth Setup
1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Navigate to "APIs & Services" > "Credentials"
4. Create OAuth client ID credentials
5. Add authorized redirect URIs (e.g., `http://localhost:5000/api/auth/google/callback` for development)
6. Copy Client ID and Client Secret to your `.env` file

### Stripe Setup
1. Create an account on [Stripe](https://stripe.com/)
2. Navigate to the Developers section
3. Get your API keys (use test keys for development)
4. Add keys to your `.env` file

To test payments, use Stripe's test card numbers:
- **Card number:** 4242 4242 4242 4242
- **Expiration:** Any future date
- **CVC:** Any 3 digits

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

**Tanmay Sawankar** - [GitHub](https://github.com/TanmaySawankar390)
