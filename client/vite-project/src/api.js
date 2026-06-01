import axios from 'axios';

const BASE_API = import.meta.env.VITE_API_URL || 'https://qu-n-l-chi-ti-u.onrender.com/api/v2';
const EXPENSE_API = `${BASE_API}/expense`;
const AUTH_API = `${BASE_API}/auth`;
const ADMIN_API = `${BASE_API}/admin`;

// 🔐 Lấy header có token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  };
};

// 📦 Lấy tất cả chi tiêu (theo user)
export const fetchData = async () => {
  try {
    const res = await axios.get(EXPENSE_API, getAuthHeader());
    return res.data.data || [];
  } catch (error) {
    console.error('❌ Fetch expenses failed:', error.response?.data || error.message);
    throw error;
  }
};

// ➕ Tạo chi tiêu mới
export const createData = async (data) => {
  try {
    const res = await axios.post(EXPENSE_API, data, getAuthHeader());
    return res.data.data;
  } catch (error) {
    console.error('❌ Create expense failed:', error.response?.data || error.message);
    throw error;
  }
};

// ✏️ Cập nhật chi tiêu
export const updateData = async (id, data) => {
  try {
    const res = await axios.put(`${EXPENSE_API}/${id}`, data, getAuthHeader());
    return res.data.data;
  } catch (error) {
    console.error('❌ Update expense failed:', error.response?.data || error.message);
    throw error;
  }
};

// 🗑️ Xóa chi tiêu
export const deleteData = async (id) => {
  try {
    const res = await axios.delete(`${EXPENSE_API}/${id}`, getAuthHeader());
    return res.data;
  } catch (error) {
    console.error('❌ Delete expense failed:', error.response?.data || error.message);
    throw error;
  }
};

// 👤 Lấy thông tin người dùng
export const getUserProfile = async () => {
  try {
    const res = await axios.get(`${AUTH_API}/profile`, getAuthHeader());
    return res.data.user;
  } catch (error) {
    console.error('❌ Fetch user profile failed:', error.response?.data || error.message);
    throw error;
  }
};

// 🔐 Đổi mật khẩu
export const changePassword = async (currentPassword, newPassword, confirmPassword) => {
  try {
    const res = await axios.put(
      `${AUTH_API}/change-password`,
      { currentPassword, newPassword, confirmPassword },
      getAuthHeader()
    );
    return res.data;
  } catch (error) {
    console.error('❌ Change password failed:', error.response?.data || error.message);
    throw error;
  }
};

// ✏️ Cập nhật tên người dùng
export const updateProfile = async (name, avatar) => {
  try {
    const res = await axios.put(
      `${AUTH_API}/update-profile`,
      { name, avatar },
      getAuthHeader()
    );
    return res.data.user;
  } catch (error) {
    console.error('❌ Update profile failed:', error.response?.data || error.message);
    throw error;
  }
};

// 📊 Lấy báo cáo hàng tháng
export const getMonthlyReport = async (month, year, monthlyLimit = null) => {
  try {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    if (monthlyLimit !== null) params.append('monthlyLimit', monthlyLimit);

    const res = await axios.get(`${EXPENSE_API}/reports/monthly?${params.toString()}`, getAuthHeader());
    return res.data.data;
  } catch (error) {
    console.error('❌ Get monthly report failed:', error.response?.data || error.message);
    throw error;
  }
};

// 💰 Lấy dữ liệu budget (định mức tháng, danh mục, custom categories)
export const getBudgetData = async () => {
  try {
    const res = await axios.get(`${AUTH_API}/budget-data`, getAuthHeader());
    return res.data.data;
  } catch (error) {
    console.error('❌ Get budget data failed:', error.response?.data || error.message);
    throw error;
  }
};

// 💾 Lưu dữ liệu budget
export const saveBudgetData = async (budgetData) => {
  try {
    const res = await axios.put(
      `${AUTH_API}/budget-data`,
      budgetData,
      getAuthHeader()
    );
    return res.data.data;
  } catch (error) {
    console.error('❌ Save budget data failed:', error.response?.data || error.message);
    throw error;
  }
};

// 🛠️ Admin - quản lý người dùng
export const getAdminUsers = async () => {
  try {
    const res = await axios.get(`${ADMIN_API}/users`, getAuthHeader());
    return res.data;
  } catch (error) {
    console.error('❌ Fetch admin users failed:', error.response?.data || error.message);
    throw error;
  }
};

export const updateUserStatus = async (userId, payload) => {
  try {
    const res = await axios.put(`${ADMIN_API}/users/${userId}/status`, payload, getAuthHeader());
    return res.data;
  } catch (error) {
    console.error('❌ Update user status failed:', error.response?.data || error.message);
    throw error;
  }
};

export const updateUserRole = async (userId, payload) => {
  try {
    const res = await axios.put(`${ADMIN_API}/users/${userId}/role`, payload, getAuthHeader());
    return res.data;
  } catch (error) {
    console.error('❌ Update user role failed:', error.response?.data || error.message);
    throw error;
  }
};

export const getGlobalCategories = async () => {
  try {
    const res = await axios.get(`${ADMIN_API}/categories`, getAuthHeader());
    return res.data;
  } catch (error) {
    console.error('❌ Fetch categories failed:', error.response?.data || error.message);
    throw error;
  }
};

export const createCategory = async (name) => {
  try {
    const res = await axios.post(`${ADMIN_API}/categories`, { name }, getAuthHeader());
    return res.data;
  } catch (error) {
    console.error('❌ Create category failed:', error.response?.data || error.message);
    throw error;
  }
};

export const updateCategory = async (categoryId, payload) => {
  try {
    const res = await axios.put(`${ADMIN_API}/categories/${categoryId}`, payload, getAuthHeader());
    return res.data;
  } catch (error) {
    console.error('❌ Update category failed:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteCategory = async (categoryId) => {
  try {
    const res = await axios.delete(`${ADMIN_API}/categories/${categoryId}`, getAuthHeader());
    return res.data;
  } catch (error) {
    console.error('❌ Delete category failed:', error.response?.data || error.message);
    throw error;
  }
};

export const getAdminSummary = async () => {
  try {
    const res = await axios.get(`${ADMIN_API}/summary`, getAuthHeader());
    return res.data;
  } catch (error) {
    console.error('❌ Fetch admin summary failed:', error.response?.data || error.message);
    throw error;
  }
};
