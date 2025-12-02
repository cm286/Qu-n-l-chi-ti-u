  const mongoose = require('mongoose');
  const bcrypt = require('bcryptjs');

  const userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'Please enter your name']
    },
    email: {
      type: String,
      required: [true, 'Please enter your email'],
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: [true, 'Please enter your password'],
      minlength: 6,
      select: false
    },
    avatar: {
      type: String,
      default: null
    }
    ,
    refreshToken: {
      type: String,
      default: null,
      select: false
    },
    // 💰 Định mức cho từng danh mục
    categoryBudgets: {
      type: Map,
      of: Number,
      default: new Map([
        ['Food', 0],
        ['Transport', 0],
        ['Shopping', 0],
        ['Entertaiment', 0],
        ['Bills', 0],
        ['Others', 0]
      ])
    },
    // 📅 Định mức hàng tháng: { 'YYYY-MM': amount }
    monthlyLimits: {
      type: Map,
      of: Number,
      default: new Map()
    },
    // 📦 Định mức danh mục theo tháng: { 'YYYY-MM': { category: amount } }
    monthlyBudgets: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: new Map()
    },
    // 🏷️ Danh mục tùy chỉnh
    customCategories: {
      type: [String],
      default: []
    }
  }, { timestamps: true });

  // 🔐 Hash password before save
  userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
  });

  // 🧩 Compare password
  userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  };

  module.exports = mongoose.model('User', userSchema);
