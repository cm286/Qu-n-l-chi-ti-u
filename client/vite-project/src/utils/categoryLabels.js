// Chuyển đổi category tiếng Anh sang tiếng Việt
export const toVN = (category) => {
  const labels = {
    'Food': 'Ăn uống',
    'Transport': 'Giao thông',
    'Shopping': 'Mua sắm',
    'Entertaiment': 'Giải trí',
    'Bills': 'Hóa đơn',
    'Others': 'Khác',
    'Food': 'Ăn uống',
  };
  return labels[category] || category;
};

// Format số tiền VND thông minh (hiển thị ngắn gọn)
// Ví dụ: 1234567 → 1.2M, 123456 → 123K, 1234 → 1.2K
export const formatVNDSmart = (amount) => {
  if (!amount || amount === 0) return '0 ₫';
  
  const num = Math.abs(amount);
  
  // Tỷ lệ
  if (num >= 1000000000) {
    return (amount / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B ';
  } else if (num >= 1000000) {
    return (amount / 1000000).toFixed(1).replace(/\.0$/, '') + 'M ';
  } else if (num >= 1000) {
    return (amount / 1000).toFixed(1).replace(/\.0$/, '') + 'K ';
  } else {
    return Math.round(amount) + ' ₫';
  }
};

// Format số tiền VND đầy đủ (có dấu phân cách hàng nghìn)
// Ví dụ: 1234567 → 1.234.567 ₫
export const formatVND = (amount) => {
  if (!amount || amount === 0) return '0 ₫';
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Danh sách các danh mục mặc định
export const DEFAULT_CATEGORIES = [
  { value: 'Food', label: 'Ăn uống' },
  { value: 'Transport', label: 'Giao thông' },
  { value: 'Shopping', label: 'Mua sắm' },
  { value: 'Entertaiment', label: 'Giải trí' },
  { value: 'Bills', label: 'Hóa đơn' },
  { value: 'Others', label: 'Khác' },
];

// Export dưới tên 'categories' để dễ import
export const categories = DEFAULT_CATEGORIES;
