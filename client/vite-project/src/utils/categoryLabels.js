export const categories = [
  { value: 'Food', label: 'Ăn uống' },
  { value: 'Transport', label: 'Đi lại' },
  { value: 'Entertaiment', label: 'Giải trí' },
  { value: 'Shopping', label: 'Mua sắm' },
  { value: 'Bills', label: 'Hóa đơn' },
  { value: 'Others', label: 'Khác' },
]

const enToVn = categories.reduce((acc, c) => {
  acc[c.value] = c.label
  return acc
}, {})

enToVn['All'] = 'Tất cả'
enToVn['Uncategorized'] = 'Không phân loại'

export const toVN = (key) => enToVn[key] || key

export const values = categories.map((c) => c.value)

// 💰 Format số thông minh - chuyển đổi thành triệu (M) hoặc tỷ (B)
export const formatSmartNumber = (amount) => {
  const num = Number(amount) || 0
  const billion = 1000000000
  const million = 1000000

  if (num >= billion) {
    return (num / billion).toFixed(1).replace(/\.0$/, '') + 'B'
  } else if (num >= million) {
    return (num / million).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  return num.toString()
}

// 💰 Format VND với rút gọn thông minh
export const formatVNDSmart = (amount) => {
  const num = Number(amount) || 0
  const billion = 1000000000
  const million = 1000000
  // Nếu nhỏ hơn 10 triệu: hiển thị bằng đồng (₫)
  const threshold = 10 * million
  if (num < threshold) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(num)
  }

  // Nếu >= 10 triệu: rút gọn sang triệu/tỷ (không thêm ký hiệu đồng)
  if (num >= billion) {
    // Truncate to 2 decimal places (không làm tròn) để các khoản nhỏ làm giảm hiển thị
    const raw = Math.floor((num / billion) * 100) / 100
    const value = raw.toFixed(2).replace(/\.0+$/, '').replace(/\.(\d)0$/, '.$1')
    return `${value} tỷ`
  } else if (num >= million) {
    const raw = Math.floor((num / million) * 100) / 100
    const value = raw.toFixed(2).replace(/\.0+$/, '').replace(/\.(\d)0$/, '.$1')
    return `${value} triệu`
  }

  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
}

