import React, { useState, useEffect } from 'react'
import { User, Mail, Calendar, X, ShieldCheck } from 'lucide-react'
import { getUserProfile } from '../api'

export default function UserProfile({ isOpen, onClose }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchUserProfile()
    }
  }, [isOpen])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      setError('')
      const userData = await getUserProfile()
      setUser(userData)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-96 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Thông tin người dùng</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <p className="text-gray-600">Đang tải...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* User Info */}
        {user && !loading && (
          <div className="space-y-4">
            {/* Name */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <User className="text-blue-500" size={20} />
              <div>
                <p className="text-sm text-gray-600">Tên</p>
                <p className="text-lg font-semibold text-gray-800">{user.name}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <Mail className="text-green-500" size={20} />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-lg font-semibold text-gray-800">{user.email}</p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <ShieldCheck className="text-blue-500" size={20} />
              <div>
                <p className="text-sm text-gray-600">Vai trò</p>
                <p className="text-lg font-semibold text-gray-800 capitalize">{user.role || 'user'}</p>
              </div>
            </div>

            {/* Trạng thái */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <Calendar className="text-orange-500" size={20} />
              <div>
                <p className="text-sm text-gray-600">Trạng thái tài khoản</p>
                <p className="text-lg font-semibold text-gray-800">{user.isActive ? 'Hoạt động' : 'Đã khóa'}</p>
              </div>
            </div>

            {/* Created Date */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <Calendar className="text-purple-500" size={20} />
              <div>
                <p className="text-sm text-gray-600">Ngày tạo tài khoản</p>
                <p className="text-sm font-semibold text-gray-800">{formatDate(user.createdAt)}</p>
              </div>
            </div>

            {/* Updated Date */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <Calendar className="text-orange-500" size={20} />
              <div>
                <p className="text-sm text-gray-600">Cập nhật lần cuối</p>
                <p className="text-sm font-semibold text-gray-800">{formatDate(user.updatedAt)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
        >
          Đóng
        </button>
      </div>
    </div>
  )
}
