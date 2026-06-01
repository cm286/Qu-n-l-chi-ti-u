const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

// 🎫 Tạo JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

// 🎫 Tạo refresh token (lâu hơn)
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// 🧍‍♂️ Đăng ký
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email đã tồn tại' });
    }

    const defaultRole = (await User.countDocuments()) === 0 ? 'admin' : 'user';
    const user = await User.create({ name, email, password, role: defaultRole });
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Lưu refresh token vào database
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      token,
      refreshToken,
      user: { id: user._id, name, email, avatar: user.avatar, role: user.role, isActive: user.isActive },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔑 Đăng nhập
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Bạn đã nhập sai email hoặc mật khẩu' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị.' });
    }

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Lưu refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔁 Refresh access token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token missing' });
    }

    // Xác thực refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Refresh token expired' });
      }
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || !user.refreshToken || user.refreshToken !== refreshToken) {
      return res.status(403).json({ success: false, message: 'Refresh token invalid or revoked' });
    }

    // Tạo access token mới
    const token = generateToken(user._id);
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔓 Logout (thu hồi refresh token)
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required' });
    }

    const user = await User.findOne({ refreshToken });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 👤 Xem thông tin người dùng
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔐 Đổi mật khẩu
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng điền đầy đủ các trường bắt buộc' 
      });
    }

    // Kiểm tra mật khẩu mới và xác nhận mật khẩu
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mật khẩu mới và xác nhận mật khẩu không khớp' 
      });
    }

    // Kiểm tra độ dài mật khẩu mới
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự' 
      });
    }

    // Lấy user với password
    const user = await User.findById(req.user.id).select('+password');
    
    // Kiểm tra mật khẩu hiện tại
    const isPasswordCorrect = await user.matchPassword(currentPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({ 
        success: false, 
        message: 'Mật khẩu hiện tại không đúng' 
      });
    }

    // Cập nhật mật khẩu mới
    user.password = newPassword;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Mật khẩu đã được thay đổi thành công' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✏️ Cập nhật thông tin người dùng (tên, avatar)
exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;

    // Kiểm tra tên
    if (name && name.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tên không được để trống' 
      });
    }

    // Cập nhật thông tin
    const user = await User.findById(req.user.id);
    
    if (name) {
      user.name = name;
    }
    
    // Chỉ cập nhật avatar nếu có giá trị
    if (avatar && avatar !== null && avatar.length > 0) {
      // Giới hạn kích thước base64 (max 1MB)
      if (avatar.length > 1 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'Avatar quá lớn. Vui lòng chọn ảnh nhỏ hơn.'
        });
      }
      user.avatar = avatar;
    }

    await user.save();

    res.json({ 
      success: true, 
      message: 'Profile đã được cập nhật thành công',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 💰 Lấy tất cả budget data (định mức tháng + danh mục)
exports.getBudgetData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    // Convert Maps to objects for JSON response
    const monthlyLimits = user.monthlyLimits ? Object.fromEntries(user.monthlyLimits) : {};
    const monthlyBudgets = user.monthlyBudgets ? Object.fromEntries(user.monthlyBudgets) : {};
    const customCategories = user.customCategories || [];

    res.json({
      success: true,
      data: {
        monthlyLimits,
        monthlyBudgets,
        customCategories
      }
    });
  } catch (error) {
    console.error('Get budget data error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 💾 Lưu tất cả budget data
exports.saveBudgetData = async (req, res) => {
  try {
    const { monthlyLimits, monthlyBudgets, customCategories } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Convert objects to Maps
    if (monthlyLimits) {
      user.monthlyLimits = new Map(Object.entries(monthlyLimits));
    }
    if (monthlyBudgets) {
      user.monthlyBudgets = new Map(Object.entries(monthlyBudgets));
    }
    if (customCategories) {
      user.customCategories = customCategories;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Budget data saved successfully',
      data: {
        monthlyLimits: Object.fromEntries(user.monthlyLimits),
        monthlyBudgets: Object.fromEntries(user.monthlyBudgets),
        customCategories: user.customCategories
      }
    });
  } catch (error) {
    console.error('Save budget data error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
