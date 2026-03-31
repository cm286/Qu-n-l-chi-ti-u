const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    category: {
      type: String,
      required: true,
      enum: ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Others'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // 👇 Thêm userId để gắn chi tiêu với tài khoản người dùng
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Làm tròn số tiền về 2 chữ số thập phân
expenseSchema.pre('save', function (next) {
  if (this.amount) this.amount = Math.round(this.amount * 100) / 100;
  next();
});

const Expense = mongoose.model('Expense', expenseSchema);
module.exports = Expense;
