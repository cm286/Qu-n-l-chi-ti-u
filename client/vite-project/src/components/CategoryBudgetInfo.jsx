import React from 'react'

function CategoryBudgetInfo({ categoryBudgets = {}, selectedMonth = '', expenses = [], allCategories = [] }) {
  // Tính số tiền còn lại cho mỗi danh mục
  const getRemaining = (catValue) => {
    const monthBudgets = categoryBudgets[selectedMonth] || {}
    const budget = Number(monthBudgets[catValue] || 0)
    if (!budget) return null
    const spent = (expenses || [])
      .filter((e) => (e.date || '').startsWith(selectedMonth) && e.category === catValue)
      .reduce((s, e) => s + Number(e.amount || 0), 0)
    return budget - spent
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold mb-2 text-gray-800">Số tiền còn lại từng danh mục</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {allCategories.map(cat => {
          const remaining = getRemaining(cat.value)
          if (remaining === null) return null
          return (
            <div key={cat.value} className="bg-gray-50 border rounded-xl p-3 flex flex-col items-center">
              <span className="font-semibold text-gray-700 text-sm">{cat.label}</span>
              <span className={`text-xs mt-1 font-bold ${remaining > 0 ? 'text-green-600' : 'text-red-600'}`}>Còn lại: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.max(remaining, 0))}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CategoryBudgetInfo
