const express = require('express');
const { adminAuth } = require('../middleware/auth');
const Purchase = require('../models/Purchase');
const User = require('../models/User');
const Product = require('../models/Product');

const router = express.Router();

router.get('/analytics', adminAuth, async (req, res) => {
  try {
    console.log('Fetching real-time analytics for super admin:', req.user.email);

    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalPurchases = await Purchase.countDocuments();
    const completedPurchases = await Purchase.countDocuments({ paymentStatus: 'completed' });
    const pendingPurchases = await Purchase.countDocuments({ paymentStatus: 'pending' });
    const failedPurchases = await Purchase.countDocuments({ paymentStatus: 'failed' });

    const revenueData = await Purchase.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { 
          _id: null, 
          totalRevenue: { $sum: '$amount' },
          avgOrderValue: { $avg: '$amount' }
        }
      }
    ]);
    
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
    const avgOrderValue = revenueData.length > 0 ? revenueData[0].avgOrderValue : 0;

    const recentPurchases = await Purchase.find()
      .populate('userId', 'name email profileImage createdAt')
      .populate('productId', 'name price imageUrl description')
      .sort({ createdAt: -1 })
      .limit(10);

    const topProducts = await Purchase.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { 
          _id: '$productId', 
          totalSold: { $sum: 1 },
          totalRevenue: { $sum: '$amount' },
          avgOrderValue: { $avg: '$amount' }
        }
      },
      { $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    const topUsers = await Purchase.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { 
          _id: '$userId', 
          totalSpent: { $sum: '$amount' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$amount' },
          lastPurchase: { $max: '$createdAt' }
        }
      },
      { $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 }
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailySales = await Purchase.aggregate([
      { 
        $match: { 
          paymentStatus: 'completed',
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
          },
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlySales = await Purchase.aggregate([
      { 
        $match: { 
          paymentStatus: 'completed',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          newUsers: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const productPerformance = await Product.aggregate([
      {
        $lookup: {
          from: 'purchases',
          localField: '_id',
          foreignField: 'productId',
          as: 'purchases'
        }
      },
      {
        $addFields: {
          totalSales: {
            $size: {
              $filter: {
                input: '$purchases',
                cond: { $eq: ['$$this.paymentStatus', 'completed'] }
              }
            }
          },
          totalRevenue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$purchases',
                    cond: { $eq: ['$$this.paymentStatus', 'completed'] }
                  }
                },
                in: '$$this.amount'
              }
            }
          }
        }
      },
      {
        $project: {
          name: 1,
          price: 1,
          totalSales: 1,
          totalRevenue: 1,
          conversionRate: {
            $cond: {
              if: { $gt: [{ $size: '$purchases' }, 0] },
              then: {
                $multiply: [
                  { $divide: ['$totalSales', { $size: '$purchases' }] },
                  100
                ]
              },
              else: 0
            }
          }
        }
      }
    ]);

    res.json({
      totalUsers,
      totalProducts,
      totalPurchases,
      completedPurchases,
      pendingPurchases,
      failedPurchases,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      avgOrderValue: Number(avgOrderValue.toFixed(2)),
      
      recentPurchases,
      topProducts,
      topUsers,
      dailySales,
      monthlySales,
      userGrowth,
      productPerformance,
      
      conversionRate: totalPurchases > 0 ? Number(((completedPurchases / totalPurchases) * 100).toFixed(2)) : 0,
      revenueGrowth: dailySales.length > 1 ? 
        Number((((dailySales[dailySales.length - 1]?.totalRevenue || 0) - (dailySales[0]?.totalRevenue || 0)) / (dailySales[0]?.totalRevenue || 1) * 100).toFixed(2)) : 0
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
});

router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find()
      .select('-googleId')
      .sort({ createdAt: -1 });

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const allPurchases = await Purchase.find({ userId: user._id });
        const completedPurchases = allPurchases.filter(p => p.paymentStatus === 'completed');
        const pendingPurchases = allPurchases.filter(p => p.paymentStatus === 'pending');
        const failedPurchases = allPurchases.filter(p => p.paymentStatus === 'failed');
        
        const totalSpent = completedPurchases.reduce((sum, purchase) => sum + purchase.amount, 0);
        const avgOrderValue = completedPurchases.length > 0 ? totalSpent / completedPurchases.length : 0;
        
        const lastPurchase = allPurchases.length > 0 ? 
          allPurchases.sort((a, b) => b.createdAt - a.createdAt)[0].createdAt : null;

        const favoriteProducts = await Purchase.aggregate([
          { $match: { userId: user._id, paymentStatus: 'completed' } },
          { $group: { _id: '$productId', count: { $sum: 1 } } },
          { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
          { $unwind: '$product' },
          { $sort: { count: -1 } },
          { $limit: 3 }
        ]);

        return {
          ...user.toObject(),
         
          totalPurchases: allPurchases.length,
          completedPurchases: completedPurchases.length,
          pendingPurchases: pendingPurchases.length,
          failedPurchases: failedPurchases.length,
          
          totalSpent: Number(totalSpent.toFixed(2)),
          avgOrderValue: Number(avgOrderValue.toFixed(2)),

          lastPurchase,
          favoriteProducts,
          accountAge: Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)),
          customerValue: completedPurchases.length > 0 ? 'High' : allPurchases.length > 0 ? 'Medium' : 'Low',

          purchaseFrequency: completedPurchases.length > 0 ? 
            Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24) / completedPurchases.length) : 0
        };
      })
    );

    usersWithStats.sort((a, b) => b.totalSpent - a.totalSpent);

    res.json(usersWithStats);
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/products', adminAuth, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    const productsWithStats = await Promise.all(
      products.map(async (product) => {
        const allPurchases = await Purchase.find({ productId: product._id });
        const completedPurchases = allPurchases.filter(p => p.paymentStatus === 'completed');
        const pendingPurchases = allPurchases.filter(p => p.paymentStatus === 'pending');
        const failedPurchases = allPurchases.filter(p => p.paymentStatus === 'failed');
        
        const totalRevenue = completedPurchases.reduce((sum, purchase) => sum + purchase.amount, 0);
        
        const recentBuyers = await Purchase.find({ 
          productId: product._id, 
          paymentStatus: 'completed' 
        })
          .populate('userId', 'name email profileImage')
          .sort({ createdAt: -1 })
          .limit(5);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentSales = await Purchase.countDocuments({
          productId: product._id,
          paymentStatus: 'completed',
          createdAt: { $gte: thirtyDaysAgo }
        });

        const conversionRate = allPurchases.length > 0 ? 
          (completedPurchases.length / allPurchases.length) * 100 : 0;

        const popularityScore = (completedPurchases.length * 0.6) + (totalRevenue * 0.4 / 1000);

        return {
          ...product.toObject(),
          totalSales: completedPurchases.length,
          pendingSales: pendingPurchases.length,
          failedSales: failedPurchases.length,
          totalAttempts: allPurchases.length,
          
          totalRevenue: Number(totalRevenue.toFixed(2)),
          avgSaleValue: completedPurchases.length > 0 ? 
            Number((totalRevenue / completedPurchases.length).toFixed(2)) : product.price,

          conversionRate: Number(conversionRate.toFixed(2)),
          recentSales30Days: recentSales,
          popularityScore: Number(popularityScore.toFixed(2)),

          recentBuyers: recentBuyers.map(p => ({
            user: p.userId,
            purchaseDate: p.createdAt,
            amount: p.amount,
            paymentId: p.stripePaymentId
          })),

          status: completedPurchases.length > 0 ? 'Active' : 'No Sales',
          trending: recentSales > 0 ? 'Up' : 'Flat',
          firstSale: completedPurchases.length > 0 ? 
            completedPurchases.sort((a, b) => a.createdAt - b.createdAt)[0].createdAt : null,
          lastSale: completedPurchases.length > 0 ? 
            completedPurchases.sort((a, b) => b.createdAt - a.createdAt)[0].createdAt : null
        };
      })
    );

    productsWithStats.sort((a, b) => b.popularityScore - a.popularityScore);

    res.json(productsWithStats);
  } catch (error) {
    console.error('Admin products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/purchases', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const userId = req.query.userId;
    const productId = req.query.productId;

    let filter = {};
    if (status) filter.paymentStatus = status;
    if (userId) filter.userId = userId;
    if (productId) filter.productId = productId;

    const purchases = await Purchase.find(filter)
      .populate({
        path: 'userId',
        select: 'name email profileImage createdAt',
      })
      .populate({
        path: 'productId',
        select: 'name description price imageUrl'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPurchases = await Purchase.countDocuments(filter);
    const totalPages = Math.ceil(totalPurchases / limit);

    const stats = await Purchase.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'completed'] }, '$amount', 0] } },
          completedCount: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'completed'] }, 1, 0] } },
          pendingCount: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] } },
          failedCount: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'failed'] }, 1, 0] } }
        }
      }
    ]);

    const summary = stats.length > 0 ? stats[0] : {
      totalAmount: 0,
      completedCount: 0,
      pendingCount: 0,
      failedCount: 0
    };

    res.json({
      purchases,
      pagination: {
        currentPage: page,
        totalPages,
        totalPurchases,
        hasMore: page < totalPages,
        limit
      },
      summary
    });
  } catch (error) {
    console.error('Admin purchases error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/user-purchases/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const purchases = await Purchase.find({ userId })
      .populate('productId', 'name price imageUrl description')
      .sort({ createdAt: -1 });

    const user = await User.findById(userId).select('-googleId');

    const stats = {
      totalOrders: purchases.length,
      completedOrders: purchases.filter(p => p.paymentStatus === 'completed').length,
      totalSpent: purchases
        .filter(p => p.paymentStatus === 'completed')
        .reduce((sum, p) => sum + p.amount, 0),
      avgOrderValue: 0
    };

    stats.avgOrderValue = stats.completedOrders > 0 ? stats.totalSpent / stats.completedOrders : 0;

    res.json({
      user,
      purchases,
      stats
    });
  } catch (error) {
    console.error('User purchases error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/users/:userId/admin', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isAdmin } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.email === process.env.SUPER_ADMIN_EMAIL && !isAdmin) {
      return res.status(400).json({ message: 'Cannot remove admin status from super admin' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isAdmin },
      { new: true }
    ).select('-googleId');

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;