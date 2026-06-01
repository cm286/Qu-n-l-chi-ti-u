const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên danh mục là bắt buộc'],
      unique: true,
      trim: true,
      maxlength: [50, 'Tên danh mục không được quá 50 ký tự'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
