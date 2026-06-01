import React, { useState, useRef, useEffect } from 'react'
import { saveBudgetData } from '../api'
import { User, Lock, LogOut, ChevronDown, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function UserMenu({ onOpenProfile, onOpenChangePassword, onOpenEditProfile }) {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState(null)
  const menuRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'))
    if (userData) {
      setUser(userData)
    }
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    if (!window.confirm('Bạn có chắc muốn đăng xuất không?')) return

    // Try to persist any budget data stored in localStorage to server before logout
    try {
      const monthlyLimits = JSON.parse(localStorage.getItem('monthlyLimits') || '{}')
      const monthlyBudgets = JSON.parse(localStorage.getItem('categoryBudgets') || '{}')
      const customCategories = JSON.parse(localStorage.getItem('customCategories') || '[]')

      await saveBudgetData({
        monthlyLimits,
        monthlyBudgets,
        customCategories,
      })
    } catch (err) {
      console.error('Error saving budget data during logout:', err)
      // proceed with logout even if save fails
    }

    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login', { replace: true })
  }

  const handleProfileClick = () => {
    onOpenProfile()
    setIsOpen(false)
  }

  const handleChangePasswordClick = () => {
    onOpenChangePassword()
    setIsOpen(false)
  }

  const handleEditProfileClick = () => {
    onOpenEditProfile()
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full font-semibold transition-all shadow-md hover:shadow-lg"
      >
        {/* Avatar Circle */}
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-white">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <User size={18} className="text-blue-500" />
          )}
        </div>
        {user?.name ? user.name.split(' ')[0] : 'User'}
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* User Info */}
          {user && (
            <div className="px-4 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b flex items-center gap-3">
              {/* Avatar */}
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-blue-300">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={24} className="text-blue-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-600 mt-1">{user.email}</p>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="py-2">
            {/* View Profile */}
            <button
              onClick={handleProfileClick}
              className="w-full px-4 py-3 flex items-center gap-3 text-gray-700 hover:bg-blue-50 transition-colors text-left"
            >
              <User size={18} className="text-blue-500" />
              <span>Xem thông tin</span>
            </button>

            {/* Edit Profile */}
            <button
              onClick={handleEditProfileClick}
              className="w-full px-4 py-3 flex items-center gap-3 text-gray-700 hover:bg-purple-50 transition-colors text-left"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-500">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <span>Chỉnh sửa hồ sơ</span>
            </button>

            {/* Change Password */}
            <button
              onClick={handleChangePasswordClick}
              className="w-full px-4 py-3 flex items-center gap-3 text-gray-700 hover:bg-green-50 transition-colors text-left"
            >
              <Lock size={18} className="text-green-500" />
              <span>Đổi mật khẩu</span>
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  setIsOpen(false)
                  navigate('/admin')
                }}
                className="w-full px-4 py-3 flex items-center gap-3 text-gray-700 hover:bg-blue-50 transition-colors text-left"
              >
                <ShieldCheck size={18} className="text-blue-500" />
                <span>Admin panel</span>
              </button>
            )}

            {/* Divider */}
            <div className="my-2 border-t"></div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 flex items-center gap-3 text-red-700 hover:bg-red-50 transition-colors text-left"
            >
              <LogOut size={18} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
