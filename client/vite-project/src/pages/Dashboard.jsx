import React, { useEffect, useState, useRef } from 'react'
import {
  DollarSign,
  Plus,
  Wallet,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  SlidersHorizontal,
  Moon,
  Sun,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../components/StatCard'
import SpendingChart from '../components/SpendingChart'
import CategoryChart from '../components/CategoryChart'
import TransactionList from '../components/TransactionList'
import Model from '../components/Model'
import Hello from '../components/Hello'
import Export from '../components/Export'
import UserMenu from '../components/UserMenu'
import UserProfile from '../components/UserProfile'
import ChangePassword from '../components/ChangePassword'
import EditProfile from '../components/EditProfile'
import { fetchData, createData, deleteData, updateData, getBudgetData, saveBudgetData } from '../api'
import CategoryBudgetInfo from '../components/CategoryBudgetInfo'
import { categories as CATEGORY_LIST, formatVNDSmart, toVN } from '../utils/categoryLabels'

// 🖼️ Thêm logo
import logo from '../assets/favicon.png'
const formatVND = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)


function Dashboard({ isDark, setIsDark }) {
  const [expenses, setExpenses] = useState([])
  const [isModelOpen, setIsModelOpen] = useState(false)
  const [isLimitOpen, setIsLimitOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  // Lưu định mức theo từng tháng: object keyed by 'YYYY-MM'
  const [monthlyLimits, setMonthlyLimits] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('monthlyLimits')) || {}
    } catch (e) {
      return {}
    }
  })
  // categoryBudgets is now keyed by month: { 'YYYY-MM': { categoryName: amount, ... }, ... }
  const [categoryBudgets, setCategoryBudgets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('categoryBudgets')) || {}
    } catch (e) {
      return {}
    }
  })
  const [customCategories, setCustomCategories] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('customCategories')) || []
    } catch (e) {
      return []
    }
  })
  const [newCategoryInput, setNewCategoryInput] = useState('')
  const [categoryWarnings, setCategoryWarnings] = useState([])
  const [limitInput, setLimitInput] = useState(null)
  const [categoryBudgetInputs, setCategoryBudgetInputs] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [showAlert, setShowAlert] = useState(false)

  const navigate = useNavigate()

  const getCurrentMonthKey = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey())
  const initialBudgetLoaded = useRef(false)
  const [showExactRemaining, setShowExactRemaining] = useState(false)

  // Derived limit for the selected month
  const monthlyLimit = Number(monthlyLimits[selectedMonth] ?? 0)

  // Sync limitInput when selectedMonth or monthlyLimits change
  useEffect(() => {
    setLimitInput(monthlyLimits[selectedMonth] ?? 0)
    // Load category budgets for the selected month
    const monthBudgets = categoryBudgets[selectedMonth] || {}
    // Ensure all custom categories exist with default 0
    const merged = { ...monthBudgets }
    for (const c of customCategories) {
      if (!(c in merged)) merged[c] = 0
    }
    // Also ensure default categories exist
    const defaults = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Others']
    for (const d of defaults) {
      if (!(d in merged)) merged[d] = 0
    }
    setCategoryBudgetInputs(merged)
  }, [selectedMonth, monthlyLimits, categoryBudgets, customCategories])

  // ⚠️ Kiểm tra cảnh báo vượt định mức danh mục cho tháng được chọn
  useEffect(() => {
    const monthKey = selectedMonth
    const warnings = []
    const categories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Others', ...customCategories]

    const monthBudgets = categoryBudgets[monthKey] || {}

    for (const category of categories) {
      const budget = Number(monthBudgets[category] || 0)
      if (budget > 0) {
        const categoryExpenses = expenses
          .filter((e) => {
            const eDate = e.date ? String(e.date) : ''
            return eDate.startsWith(monthKey) && e.category === category
          })
          .reduce((sum, e) => sum + Number(e.amount || 0), 0)

        if (categoryExpenses > budget) {
          warnings.push({
            type: 'CATEGORY_BUDGET_EXCEEDED',
            message: `Chi tiêu danh mục "${category}" đã vượt quá định mức!`,
            category,
            budgetLimit: budget,
            currentTotal: categoryExpenses,
            newTotal: categoryExpenses,
            exceedAmount: categoryExpenses - budget,
          })
        }
      }
    }

    setCategoryWarnings(warnings)
  }, [expenses, categoryBudgets, selectedMonth, customCategories])

  // 🔁 Auto-save budget data (debounced) whenever budgets/custom categories change
  useEffect(() => {
    // don't autosave until initial load from server finishes
    if (!localStorage.getItem('token') || !initialBudgetLoaded.current) return

    const timer = setTimeout(async () => {
      try {
        await saveBudgetData({
          monthlyLimits: monthlyLimits,
          monthlyBudgets: categoryBudgets,
          customCategories: customCategories,
        })
      } catch (err) {
        console.error('Auto-save budget data failed:', err)
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [monthlyLimits, categoryBudgets, customCategories])
  const formatMonthVN = (ym) => {
    try {
      const d = new Date(`${ym}-01`)
      return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
    } catch (e) {
      return ym
    }
  }

  // 📊 Tính toán thống kê
  const calculateTotal = (list) => {
    const total = list.reduce((sum, e) => sum + Number(e.amount || 0), 0)
    const categoryTotals = list.reduce((acc, e) => {
      const cat = e.category || 'Uncategorized'
      acc[cat] = (acc[cat] || 0) + Number(e.amount || 0)
      return acc
    }, {})
    return {
      total,
      count: list.length,
      avg: list.length ? total / list.length : 0,
      highest: list.length ? Math.max(...list.map((e) => Number(e.amount || 0))) : 0,
      categoryTotals,
    }
  }

  const stats = calculateTotal(expenses)
  // Thống kê cho tháng đang chọn (format YYYY-MM)
  const monthExpenses = (expenses || []).filter((e) => {
    const d = e.date ? String(e.date) : ''
    return d.startsWith(selectedMonth)
  })
  const monthStats = calculateTotal(monthExpenses)

  // 🔄 Lấy dữ liệu từ API
  useEffect(() => {
    const loadExpenses = async () => {
      try {
        const data = await fetchData()
        const normalized = (data || []).map((e) => ({
          ...e,
          date: e?.date ? e.date.split('T')[0] : new Date().toISOString().split('T')[0],
        }))
        setExpenses(normalized)
      } catch (error) {
        console.error('Error loading expenses:', error)
      }
    }

    const loadBudgetData = async () => {
      try {
        const budgetData = await getBudgetData()
        if (budgetData) {
          // Load từ server thay vì localStorage
          if (budgetData.monthlyLimits) {
            setMonthlyLimits(budgetData.monthlyLimits)
            localStorage.setItem('monthlyLimits', JSON.stringify(budgetData.monthlyLimits))
          }
          if (budgetData.monthlyBudgets) {
            setCategoryBudgets(budgetData.monthlyBudgets)
            localStorage.setItem('categoryBudgets', JSON.stringify(budgetData.monthlyBudgets))
          }
          if (budgetData.customCategories) {
            setCustomCategories(budgetData.customCategories)
            localStorage.setItem('customCategories', JSON.stringify(budgetData.customCategories))
          }
          // mark that initial budget was loaded from server
          initialBudgetLoaded.current = true
        }
      } catch (error) {
        console.error('Error loading budget data:', error)
      }
    }

    loadExpenses()
    loadBudgetData()
  }, [])

  // ⚠️ Cảnh báo vượt định mức (so sánh theo tháng đang chọn)
  useEffect(() => {
    setShowAlert(monthStats.total > monthlyLimit)
  }, [monthStats.total, monthlyLimit])

  // ➕ Thêm chi tiêu
  const handleAddExpense = async (payload) => {
    try {
      const created = await createData(payload)
      setExpenses((prev) => [{ ...created, date: created.date.split('T')[0] }, ...prev])
      setIsModelOpen(false)
    } catch (error) {
      console.error('Error adding expense:', error)
    }
  }

  // ✏️ Sửa chi tiêu
  const onEditExpense = (expense) => {
    setEditingExpense(expense)
    setIsModelOpen(true)
  }

  const handleSaveEdit = async (payload) => {
    if (!editingExpense) return
    try {
      const updated = await updateData(editingExpense._id, payload)
      setExpenses((prev) =>
        prev.map((e) =>
          e._id === updated._id ? { ...updated, date: updated.date.split('T')[0] } : e
        )
      )
      setEditingExpense(null)
      setIsModelOpen(false)
    } catch (error) {
      console.error('Error saving edited expense:', error)
    }
  }

  // 🗑️ Xóa chi tiêu
  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa chi tiêu này?')) return
    try {
      await deleteData(id)
      setExpenses((prev) => prev.filter((e) => e._id !== id))
    } catch (error) {
      console.error('Lỗi khi xóa chi tiêu:', error)
    }
  }

  // 💰 Lưu định mức cho tháng đang chọn
  const handleSaveLimit = async (e) => {
    e.preventDefault()
    // Lấy giá trị từ input, loại bỏ dấu phân ngăn
    const rawValue = e.target.limit.value.replace(/\./g, '').trim()
    const newLimit = Number(rawValue)

    if (isNaN(newLimit) || newLimit <= 0) {
      alert('⚠️ Vui lòng nhập định mức hợp lệ.')
      return
    }

    const updated = { ...monthlyLimits, [selectedMonth]: newLimit }
    setMonthlyLimits(updated)
    localStorage.setItem('monthlyLimits', JSON.stringify(updated))

    // Lưu lên server
    try {
      await saveBudgetData({
        monthlyLimits: updated,
        monthlyBudgets: categoryBudgets,
        customCategories: customCategories
      })
    } catch (error) {
      console.error('Error saving budget data:', error)
      alert('Lỗi khi lưu định mức. Vui lòng thử lại.')
    }
  }

  // 💰 Lưu định mức danh mục cho tháng đang chọn
  const handleSaveCategoryBudgets = async (e) => {
    e.preventDefault()
    const updated = { ...(categoryBudgets || {}) }
    updated[selectedMonth] = { ...(categoryBudgetInputs || {}) }
    setCategoryBudgets(updated)
    localStorage.setItem('categoryBudgets', JSON.stringify(updated))
    
    // Lưu lên server
    try {
      await saveBudgetData({
        monthlyLimits: monthlyLimits,
        monthlyBudgets: updated,
        customCategories: customCategories
      })
    } catch (error) {
      console.error('Error saving category budgets:', error)
      alert('Lỗi khi lưu định mức. Vui lòng thử lại.')
      return
    }
    
    setIsLimitOpen(false)
  }

  // ➕ Thêm danh mục mới
  const handleAddCategory = async () => {
    if (!newCategoryInput.trim()) {
      alert('⚠️ Vui lòng nhập tên danh mục')
      return
    }

    const categoryName = newCategoryInput.trim()
    
    // Kiểm tra danh mục đã tồn tại
    const allCategories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Others', ...customCategories]
    if (allCategories.includes(categoryName)) {
      alert('⚠️ Danh mục này đã tồn tại')
      return
    }

    const updated = [...customCategories, categoryName]
    setCustomCategories(updated)
    localStorage.setItem('customCategories', JSON.stringify(updated))
    
    // Thêm vào categoryBudgetInputs
    setCategoryBudgetInputs({
      ...categoryBudgetInputs,
      [categoryName]: 0
    })
    
    setNewCategoryInput('')

    // Lưu lên server
    try {
      await saveBudgetData({
        monthlyLimits: monthlyLimits,
        monthlyBudgets: categoryBudgets,
        customCategories: updated
      })
    } catch (error) {
      console.error('Error saving custom category:', error)
    }
  }

  // 🗑️ Xóa danh mục (bất kỳ danh mục nào)
  const handleDeleteCategory = async (categoryName) => {
    if (!window.confirm(`Xóa danh mục "${categoryName}"?`)) return
    
    let updatedCustom = customCategories
    // Nếu là danh mục custom, xóa khỏi customCategories
    if (customCategories.includes(categoryName)) {
      updatedCustom = customCategories.filter(cat => cat !== categoryName)
      setCustomCategories(updatedCustom)
      localStorage.setItem('customCategories', JSON.stringify(updatedCustom))
    }

    // Xóa khỏi categoryBudgetInputs (tháng hiện tại)
    const newInputs = { ...categoryBudgetInputs }
    delete newInputs[categoryName]
    setCategoryBudgetInputs(newInputs)

    // Xóa danh mục khỏi tất cả các tháng trong categoryBudgets
    const newBudgets = { ...(categoryBudgets || {}) }
    for (const m of Object.keys(newBudgets)) {
      if (newBudgets[m] && newBudgets[m][categoryName] !== undefined) {
        const copy = { ...newBudgets[m] }
        delete copy[categoryName]
        newBudgets[m] = copy
      }
    }
    setCategoryBudgets(newBudgets)
    localStorage.setItem('categoryBudgets', JSON.stringify(newBudgets))

    // Lưu lên server
    try {
      await saveBudgetData({
        monthlyLimits: monthlyLimits,
        monthlyBudgets: newBudgets,
        customCategories: updatedCustom
      })
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }


  // Tạo allCategories cho CategoryBudgetInfo
  const allCategories = [
    ...CATEGORY_LIST,
    ...customCategories.map(cat => ({ value: cat, label: cat }))
  ]

  return (
    <div className={`h-screen overflow-hidden transition-colors ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100'}`}>
      {/* 🔹 Header */}
      <header className={`shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className='max-w-7xl mx-auto px-4 py-4'>
          {/* Row 1: Logo + Title + Remaining + Month */}
          <div className='flex items-center gap-4 mb-3'>
            {/* Logo + Title */}
            <div className='flex items-center gap-3 flex-1 min-w-0'>
              <img
                src={logo}
                alt='Expense Tracker Logo'
                className='w-10 h-10 rounded-xl object-cover shadow-sm flex-shrink-0'
              />
              <div className='min-w-0'>
                <h1 className={`text-2xl lg:text-3xl font-bold truncate ${isDark ? 'text-gray-100' : 'text-gray-700'}`}>
                  Quản Lí Chi Tiêu
                </h1>
                <p className={`text-xs lg:text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Quản lí thu nhập dễ dàng</p>
              </div>
            </div>

            {/* Còn lại + Month selector */}
            <div className='flex items-center gap-3 flex-shrink-0'>
              {monthlyLimit > 0 && (
                <div className={`px-3 py-2 rounded-lg text-center text-xs lg:text-sm flex-shrink-0 ${
                  monthStats.total <= monthlyLimit
                    ? isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-700'
                    : isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700'
                }`}>
                  <p className='text-xs font-semibold opacity-80'>Còn lại</p>
                  <p
                    className='font-bold whitespace-nowrap cursor-pointer select-none'
                    title={showExactRemaining ? 'Bấm để xem rút gọn' : 'Bấm để xem chính xác'}
                    onClick={() => setShowExactRemaining((s) => !s)}
                  >
                    {showExactRemaining
                      ? formatVND(Math.max(0, monthlyLimit - monthStats.total))
                      : formatVNDSmart(Math.max(0, monthlyLimit - monthStats.total))}
                  </p>
                </div>
              )}

              <div className='flex items-center gap-1 flex-shrink-0'>
                <select
                  value={selectedMonth.split('-')[1]}
                  onChange={(e) => {
                    const m = e.target.value.padStart(2, '0')
                    const y = selectedMonth.split('-')[0]
                    setSelectedMonth(`${y}-${m}`)
                  }}
                  className='px-2 py-1 rounded-lg border bg-white text-sm'
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <option value={String(n).padStart(2, '0')} key={n}>{n}</option>
                  ))}
                </select>

                <select
                  value={selectedMonth.split('-')[0]}
                  onChange={(e) => {
                    const y = e.target.value
                    const m = selectedMonth.split('-')[1]
                    setSelectedMonth(`${y}-${m}`)
                  }}
                  className='px-2 py-1 rounded-lg border bg-white text-sm'
                >
                  {(() => {
                    const thisYear = new Date().getFullYear()
                    const years = []
                    for (let i = thisYear - 5; i <= thisYear + 2; i++) years.push(i)
                    return years.map((yr) => (
                      <option key={yr} value={String(yr)}>{yr}</option>
                    ))
                  })()}
                </select>
              </div>
            </div>
          </div>

          {/* Row 2: Action buttons */}
          <div className='flex items-center gap-2 flex-wrap'>
            <Hello token={localStorage.getItem('token')} />
            <Export expenses={expenses} />
            
            <button
              onClick={() => setIsLimitOpen(true)}
              className='px-3 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-amber-600 transition-all'
            >
              <SlidersHorizontal className='w-3 h-3' />
              <span className='hidden sm:inline'>Thiết Lập Định Mức</span>
            </button>

            <button
              onClick={() => navigate('/reports/monthly')}
              className='px-3 py-2 bg-indigo-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-indigo-600 transition-all'
            >
              📊
              <span className='hidden sm:inline'>Báo cáo tháng</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                isDark 
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-gray-900' 
                  : 'bg-gray-700 hover:bg-gray-800 text-white'
              }`}
              title={isDark ? 'Chế độ sáng' : 'Chế độ tối'}
            >
              {isDark ? <Sun className='w-4 h-4' /> : <Moon className='w-4 h-4' />}
            </button>

            <button
              onClick={() => {
                setEditingExpense(null)
                setIsModelOpen(true)
              }}
              className={`px-3 py-2 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-700 hover:bg-gray-800'
              }`}
            >
              <Plus className='w-4 h-4' />
              <span className='hidden sm:inline'>Thêm Chi Tiêu</span>
            </button>

            {/* UserMenu Dropdown */}
            <div className='ml-auto'>
              <UserMenu
                onOpenProfile={() => setIsProfileOpen(true)}
                onOpenChangePassword={() => setIsChangePasswordOpen(true)}
                onOpenEditProfile={() => setIsEditProfileOpen(true)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ⚠️ Alert nếu vượt định mức tháng */}
      {showAlert && (
        <div className='max-w-7xl mx-auto mt-6 px-6'>
          <div className={`${isDark ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-100 border-red-400 text-red-700'} border px-4 py-3 rounded-xl flex items-center gap-2`}>
            <AlertTriangle className='w-5 h-5 text-red-600' />
            <p className='font-semibold'>
              ⚠️ Cảnh báo: Chi tiêu {formatMonthVN(selectedMonth)}: ({formatVNDSmart(monthStats.total)}) đã vượt quá định mức: ({formatVNDSmart(monthStats.total-monthlyLimit)})!           Định mức tháng {formatMonthVN(selectedMonth)}: {formatVNDSmart(monthlyLimit)}
            </p>
          </div>
        </div>
      )}

      {/* ⚠️ Alert cho danh mục vượt định mức */}
      {categoryWarnings.length > 0 && (
        <div className='max-w-7xl mx-auto mt-6 px-6 space-y-3'>
          {categoryWarnings.map((warning, idx) => (
            <div key={idx} className={`${isDark ? 'bg-orange-900 border-orange-700 text-orange-200' : 'bg-orange-100 border-orange-400 text-orange-700'} border px-4 py-3 rounded-xl flex items-center gap-2`}>
              <AlertTriangle className='w-5 h-5' />
              <div className='flex-1'>
                <p className='font-semibold'>
                  💰 Danh mục "{warning.category}" đã vượt định mức!
                </p>
                <p className='text-sm'>
                  Định mức: {formatVNDSmart(warning.budgetLimit)} | Chi tiêu: {formatVNDSmart(warning.newTotal)} | Vượt: {formatVNDSmart(warning.exceedAmount)}
                </p>
              </div>
              <button
                onClick={() => setCategoryWarnings(categoryWarnings.filter((_, i) => i !== idx))}
                className='text-lg hover:opacity-70'
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 📈 Nội dung chính */}
      <main className='max-w-7xl mx-auto px-6 py-6 h-[calc(100vh-160px)] overflow-auto'>
        

        {/* Thống kê */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <StatCard
            value={formatVNDSmart(monthStats.total)}
            title={`Tổng Chi tiêu (${formatMonthVN(selectedMonth)})`}
            icon={Wallet}
            subtitle={`Giới hạn chi tiêu: ${formatVNDSmart(monthlyLimit)}`}
            bgColor='bg-gradient-to-br from-indigo-500 to-indigo-600'
            iconColor='bg-indigo-700'
          />
          <StatCard
            value={monthStats.count}
            title='Giao Dịch'
            icon={ShoppingCart}
            subtitle={`Tháng: ${formatMonthVN(selectedMonth)}`}
            bgColor='bg-gradient-to-br from-purple-500 to-purple-600'
            iconColor='bg-purple-700'
          />
          <StatCard
            value={formatVNDSmart(monthStats.avg)}
            title='Trung Bình'
            icon={TrendingUp}
            subtitle='Mỗi giao dịch'
            bgColor='bg-gradient-to-br from-pink-500 to-pink-600'
            iconColor='bg-pink-700'
          />
          <StatCard
            value={formatVNDSmart(monthStats.highest)}
            title='Cao nhất'
            icon={DollarSign}
            subtitle='Giao dịch cao nhất'
            bgColor='bg-gradient-to-br from-orange-500 to-orange-600'
            iconColor='bg-orange-700'
          />
        </div>
        {/* Số tiền còn lại từng danh mục */}
        <CategoryBudgetInfo
          categoryBudgets={categoryBudgets}
          selectedMonth={selectedMonth}
          expenses={expenses}
          allCategories={allCategories}
        />

        {/* Biểu đồ */}
        <div className='grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8'>
          <div className='lg:col-span-3'>
            <SpendingChart expenses={monthExpenses} month={selectedMonth} />
          </div>
          <div className='lg:col-span-2'>
            <CategoryChart categoryTotal={monthStats.categoryTotals} />
          </div>
        </div>

        {/* Danh sách giao dịch */}
          <TransactionList
          expenses={monthExpenses}
          onDelete={handleDeleteExpense}
          onEdit={onEditExpense}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
        />
      </main>

      {/* Modal Thêm / Sửa */}
      <Model
        isOpen={isModelOpen}
        onclose={() => {
          setIsModelOpen(false)
          setEditingExpense(null)
        }}
        onsubmit={editingExpense ? handleSaveEdit : handleAddExpense}
        initialData={editingExpense}
        customCategories={customCategories}
        categoryBudgets={categoryBudgets}
        selectedMonth={selectedMonth}
        expenses={expenses}
      />

      {/* Modal Giới hạn + Định mức danh mục */}
      {isLimitOpen && (
        <div className='fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm'>
          <div className={`rounded-3xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className='flex justify-between items-center mb-6'>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                💰 Thiết lập định mức
              </h2>
              <button
                onClick={() => setIsLimitOpen(false)}
                className='text-2xl hover:opacity-70'
              >
                ✕
              </button>
            </div>

            {/* Alert nếu có lỗi */}
            <div className={`mb-4 p-4 rounded-lg border-l-4 ${isDark ? 'bg-blue-900 border-blue-500 text-blue-200' : 'bg-blue-50 border-blue-500 text-blue-700'}`}>
              <p className='text-sm font-semibold'>
                ℹ️ Tổng định mức danh mục không được vượt quá định mức tháng
              </p>
            </div>

            {/* Hiển thị tổng định mức danh mục */}
            <div className={`mb-4 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                📊 Tổng định mức danh mục: {formatVNDSmart(Object.values(categoryBudgetInputs || {}).reduce((sum, val) => sum + (val || 0), 0))} / {formatVNDSmart(limitInput || 0)}
              </p>
              {Object.values(categoryBudgetInputs || {}).reduce((sum, val) => sum + (val || 0), 0) > (limitInput || 0) && limitInput > 0 && (
                <p className='text-sm text-red-500 font-semibold mt-2'>
                  ⚠️ Tổng định mức danh mục vượt quá định mức tháng!
                </p>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSaveLimit(e)
                handleSaveCategoryBudgets(e)
              }}
              className='space-y-6'
            >
              {/* Phần 1: Định mức tháng */}
              <div>
                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  📅 Định mức tháng {formatMonthVN(selectedMonth)}
                </h3>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Giới hạn số tiền (₫)
                  </label>
                  <input
                    type='text'
                    name='limit'
                    value={limitInput !== null ? new Intl.NumberFormat('vi-VN').format(limitInput) : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '')
                      if (raw === '') return setLimitInput(0)
                      setLimitInput(Number(raw))
                    }}
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:border-indigo-500 transition ${
                      isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              {/* Phần 2: Định mức danh mục */}
              <div className='border-t pt-6'>
                <div className='flex justify-between items-center mb-4'>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    🏷️ Định mức cho từng danh mục
                  </h3>
                </div>

                {/* Phần thêm danh mục mới */}
                <div className='mb-6 p-4 rounded-lg border-2' style={{borderColor: isDark ? '#4b5563' : '#e5e7eb'}}>
                  <p className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    ➕ Thêm danh mục mới
                  </p>
                  <div className='flex gap-2'>
                    <input
                      type='text'
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                      placeholder='Nhập tên danh mục...'
                      className={`flex-1 px-3 py-2 border-2 rounded-lg focus:outline-none focus:border-indigo-500 transition ${
                        isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-900'
                      }`}
                    />
                    <button
                      type='button'
                      onClick={handleAddCategory}
                      className='px-4 py-2 bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-600 transition'
                    >
                      Thêm
                    </button>
                  </div>
                </div>

                {/* Danh sách danh mục */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Others', ...customCategories].map((category) => {
                    const totalOtherBudgets = Object.entries(categoryBudgetInputs || {})
                      .reduce((sum, [cat, val]) => cat !== category ? sum + (val || 0) : sum, 0)
                    const maxBudgetForCategory = (limitInput || 0) - totalOtherBudgets
                    
                    return (
                      <div key={category}>
                        <div className='flex justify-between items-start mb-2'>
                          <label className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {toVN(category)}
                          </label>
                          <button
                            type='button'
                            onClick={() => handleDeleteCategory(category)}
                            className='text-red-500 hover:text-red-700 font-bold text-lg'
                            title='Xóa danh mục'
                          >
                            ✕
                          </button>
                        </div>
                        <input
                          type='text'
                          value={
                            categoryBudgetInputs[category]
                              ? new Intl.NumberFormat('vi-VN').format(categoryBudgetInputs[category])
                              : '0'
                          }
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '')
                            const newValue = raw === '' ? 0 : Number(raw)
                            
                            // Kiểm tra không vượt quá định mức tháng
                            const totalOther = Object.entries(categoryBudgetInputs || {})
                              .reduce((sum, [cat, val]) => cat !== category ? sum + (val || 0) : sum, 0)
                            
                            if (newValue + totalOther <= (limitInput || 0) || limitInput === 0) {
                              setCategoryBudgetInputs({
                                ...categoryBudgetInputs,
                                [category]: newValue,
                              })
                            }
                          }}
                          placeholder='0'
                          className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:border-indigo-500 transition ${
                            isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-900'
                          }`}
                        />
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatVNDSmart(categoryBudgetInputs[category] || 0)}
                          {limitInput > 0 && ` (Tối đa: ${formatVNDSmart(maxBudgetForCategory)})`}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className='flex gap-3 mt-6 pt-4 border-t'>
                <button
                  type='submit'
                  disabled={Object.values(categoryBudgetInputs || {}).reduce((sum, val) => sum + (val || 0), 0) > (limitInput || 0) && limitInput > 0}
                  className='flex-1 bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  💾 Lưu định mức
                </button>
                <button
                  type='button'
                  onClick={() => setIsLimitOpen(false)}
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
      )}

      {/* 👤 Modal Thông tin người dùng */}
      <UserProfile isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      {/* 🔐 Modal Đổi mật khẩu */}
      <ChangePassword isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} />

      {/* ✏️ Modal Chỉnh sửa hồ sơ */}
      <EditProfile 
        isOpen={isEditProfileOpen} 
        onClose={() => setIsEditProfileOpen(false)}
        onProfileUpdated={() => window.location.reload()}
      />
    </div>
  )
}

export default Dashboard
