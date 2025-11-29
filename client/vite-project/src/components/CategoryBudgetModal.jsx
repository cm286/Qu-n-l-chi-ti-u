import React, { useState, useEffect } from 'react'
import { AlertCircle, Save, X } from 'lucide-react'

const formatVND = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertaiment', 'Bills', 'Others']

function CategoryBudgetModal({ isOpen, onClose, isDark, onSave }) {
  const [budgets, setBudgets] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load category budgets từ API khi modal mở
  useEffect(() => {
    if (isOpen) {
      loadCategoryBudgets()
    }
  }, [isOpen])

  const loadCategoryBudgets = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/category-budgets', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setBudgets(data.categoryBudgets || {})
        setError('')
      }
    } catch (err) {
      console.error('Error loading category budgets:', err)
      setError('Không thể tải định mức danh mục')
    }
  }

  const handleBudgetChange = (category, value) => {
    const raw = value.replace(/\./g, '').replace(/[^0-9]/g, '')
    setBudgets({
      ...budgets,
      [category]: raw === '' ? 0 : Number(raw)
    })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/category-budgets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ categoryBudgets: budgets })
      })

      const data = await response.json()

      if (data.success) {
        if (onSave) {
          onSave(data.categoryBudgets)
        }
        onClose()
      } else {
        setError(data.message || 'Lỗi khi cập nhật định mức')
      }
    } catch (err) {
      console.error('Error saving category budgets:', err)
      setError('Lỗi khi cập nhật định mức')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm'>
      <div className={`rounded-3xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className='flex justify-between items-center mb-6'>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            💰 Thiết lập định mức danh mục
          </h2>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {error && (
          <div className={`mb-4 flex items-center gap-2 p-3 rounded-lg ${isDark ? 'bg-red-900 text-red-200 border border-red-700' : 'bg-red-100 text-red-700 border border-red-300'}`}>
            <AlertCircle className='w-5 h-5' />
            <p className='text-sm font-semibold'>{error}</p>
          </div>
        )}

        <form onSubmit={handleSave} className='space-y-4'>
          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-blue-50'} border-l-4 border-blue-500`}>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              ℹ️ Nhập định mức chi tiêu cho mỗi danh mục (tính theo tháng). Để 0 nếu không muốn giới hạn.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {CATEGORIES.map((category) => (
              <div key={category}>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {category}
                </label>
                <input
                  type='text'
                  value={budgets[category] ? new Intl.NumberFormat('vi-VN').format(budgets[category]) : '0'}
                  onChange={(e) => handleBudgetChange(category, e.target.value)}
                  placeholder='0'
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:border-indigo-500 transition ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-gray-100'
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {budgets[category] ? formatVND(budgets[category]) : 'Không giới hạn'}
                </p>
              </div>
            ))}
          </div>

          <div className='flex gap-3 mt-6 pt-4 border-t'>
            <button
              type='submit'
              disabled={loading}
              className='flex-1 bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50'
            >
              <Save className='w-4 h-4' />
              {loading ? 'Đang lưu...' : 'Lưu định mức'}
            </button>
            <button
              type='button'
              onClick={onClose}
              className={`px-6 py-3 rounded-lg font-semibold border-2 transition ${
                isDark
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CategoryBudgetModal
