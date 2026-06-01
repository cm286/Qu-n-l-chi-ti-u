import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getAdminSummary,
  getAdminUsers,
  updateUserStatus,  updateUserRole,  getGlobalCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../api'
import { ShieldCheck, Users, Lock, Unlock, FolderPlus, Trash2, Edit, ArrowLeft, TrendingUp } from 'lucide-react'

function AdminPanel() {
  const [summary, setSummary] = useState(null)
  const [users, setUsers] = useState([])
  const [categories, setCategories] = useState([])
  const [newCategory, setNewCategory] = useState('')
  const [editingCategory, setEditingCategory] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const loadAdminData = async () => {
    setLoading(true)
    setError('')
    try {
      const [summaryRes, usersRes, categoriesRes] = await Promise.all([
        getAdminSummary(),
        getAdminUsers(),
        getGlobalCategories(),
      ])
      setSummary(summaryRes.summary)
      setUsers(usersRes.users)
      setCategories(categoriesRes.categories)
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải dữ liệu admin')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  const handleToggleStatus = async (user) => {
    try {
      const res = await updateUserStatus(user._id, { isActive: !user.isActive })
      setUsers((prev) => prev.map((item) => (item._id === user._id ? res.user : item)))
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể cập nhật trạng thái người dùng')
    }
  }

  const handleChangeRole = async (user) => {
    try {
      const res = await updateUserRole(user._id, { role: user.role === 'admin' ? 'user' : 'admin' })
      setUsers((prev) => prev.map((item) => (item._id === user._id ? res.user : item)))
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể cập nhật quyền người dùng')
    }
  }

  const handleSaveCategory = async () => {
    if (!newCategory.trim()) return
    try {
      await createCategory(newCategory.trim())
      setNewCategory('')
      loadAdminData()
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tạo danh mục mới')
    }
  }

  const handleEditCategory = async () => {
    if (!editingCategory?.name?.trim()) return
    try {
      await updateCategory(editingCategory._id, { name: editingCategory.name.trim() })
      setEditingCategory(null)
      loadAdminData()
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể cập nhật danh mục')
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Bạn có chắc muốn xóa danh mục này?')) return
    try {
      await deleteCategory(categoryId)
      loadAdminData()
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xóa danh mục')
    }
  }

  return (
    <div className='min-h-screen bg-slate-50 text-slate-900'>
      <div className='max-w-7xl mx-auto px-6 py-6'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6'>
          <div>
            <h1 className='text-3xl font-bold'>Bảng điều khiển Admin</h1>
            <p className='text-sm text-slate-600 mt-1'>Quản lý người dùng, danh mục và tổng quan dữ liệu hệ thống.</p>
          </div>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => navigate('/dashboard')}
              className='inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100'
            >
              <ArrowLeft size={18} /> Quay lại
            </button>
          </div>
        </div>

        {loading && (
          <div className='rounded-2xl bg-white p-6 shadow-sm'>Đang tải dữ liệu admin...</div>
        )}

        {error && (
          <div className='rounded-2xl bg-red-50 border border-red-200 p-4 text-red-700 mb-6'>
            {error}
          </div>
        )}

        {summary && (
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
            <div className='rounded-3xl bg-white p-5 shadow-sm border'>
              <div className='flex items-center gap-3 mb-4 text-slate-800'>
                <Users size={20} />
                <p className='font-semibold'>Tổng tài khoản</p>
              </div>
              <p className='text-3xl font-bold'>{summary.totalUsers}</p>
              <p className='text-sm text-slate-500 mt-1'>Tài khoản đã kích hoạt: {summary.activeUsers}</p>
            </div>
            <div className='rounded-3xl bg-white p-5 shadow-sm border'>
              <div className='flex items-center gap-3 mb-4 text-slate-800'>
                <ShieldCheck size={20} />
                <p className='font-semibold'>Đăng ký mới 30 ngày</p>
              </div>
              <p className='text-3xl font-bold'>{summary.newUsersLast30Days}</p>
              <p className='text-sm text-slate-500 mt-1'>Tài khoản mới trong tháng gần nhất</p>
            </div>
            <div className='rounded-3xl bg-white p-5 shadow-sm border'>
              <div className='flex items-center gap-3 mb-4 text-slate-800'>
                <FolderPlus size={20} />
                <p className='font-semibold'>Danh mục global</p>
              </div>
              <p className='text-3xl font-bold'>{categories.length}</p>
              <p className='text-sm text-slate-500 mt-1'>Danh mục mặc định trên hệ thống</p>
            </div>
            <div className='rounded-3xl bg-white p-5 shadow-sm border'>
              <div className='flex items-center gap-3 mb-4 text-slate-800'>
                <TrendingUp size={20} />
                <p className='font-semibold'>Tổng giao dịch</p>
              </div>
              <p className='text-3xl font-bold'>{summary.totalTransactions}</p>
              <p className='text-sm text-slate-500 mt-1'>Giao dịch đã phát sinh toàn hệ thống</p>
            </div>
          </div>
        )}

        <div className='grid gap-6 lg:grid-cols-[1.5fr_1fr]'>
          <section className='rounded-3xl bg-white p-6 shadow-sm border'>
            <h2 className='text-xl font-semibold mb-4'>Quản lý người dùng</h2>
            <div className='overflow-x-auto'>
              <table className='min-w-full text-left text-sm'>
                <thead className='bg-slate-100 text-slate-600'>
                  <tr>
                    <th className='px-4 py-3'>Tên</th>
                    <th className='px-4 py-3'>Email</th>
                    <th className='px-4 py-3'>Vai trò</th>
                    <th className='px-4 py-3'>Trạng thái</th>
                    <th className='px-4 py-3'>Tình trạng</th>
                    <th className='px-4 py-3'>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className='border-t border-slate-100'>
                      <td className='px-4 py-3'>{user.name}</td>
                      <td className='px-4 py-3'>{user.email}</td>
                      <td className='px-4 py-3 capitalize'>{user.role}</td>
                      <td className='px-4 py-3'>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className='px-4 py-3'>
                        <button
                          type='button'
                          onClick={() => handleToggleStatus(user)}
                          className='inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800'
                        >
                          {user.isActive ? <Lock size={14} /> : <Unlock size={14} />} 
                          {user.isActive ? 'Khóa' : 'Kích hoạt'}
                        </button>
                      </td>
                      <td className='px-4 py-3'>
                        <button
                          type='button'
                          onClick={() => handleChangeRole(user)}
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${user.role === 'admin' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                        >
                          <ShieldCheck size={14} />
                          {user.role === 'admin' ? 'Gỡ admin' : 'Cấp admin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className='rounded-3xl bg-white p-6 shadow-sm border'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-xl font-semibold'>Quản lý danh mục</h2>
              <button
                type='button'
                onClick={handleSaveCategory}
                className='inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700'
              >
                <FolderPlus size={16} /> Thêm danh mục
              </button>
            </div>

            <div className='space-y-4'>
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder='Nhập tên danh mục mới...'
                className='w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500'
              />

              <div className='space-y-3'>
                {categories.map((category) => (
                  <div key={category._id} className='flex flex-col gap-3 rounded-2xl border border-slate-200 p-4'>
                    <div className='flex items-center justify-between gap-3'>
                      <div>
                        <p className='font-semibold'>{category.name}</p>
                        <p className='text-xs text-slate-500'>ID: {category._id}</p>
                      </div>
                      <div className='flex items-center gap-2'>
                        <button
                          type='button'
                          onClick={() => setEditingCategory(category)}
                          className='inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100'
                        >
                          <Edit size={14} /> Sửa
                        </button>
                        <button
                          type='button'
                          onClick={() => handleDeleteCategory(category._id)}
                          className='inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-200'
                        >
                          <Trash2 size={14} /> Xóa
                        </button>
                      </div>
                    </div>
                    {editingCategory?._id === category._id && (
                      <div className='space-y-3'>
                        <input
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory((prev) => ({ ...prev, name: e.target.value }))}
                          className='w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm'
                        />
                        <div className='flex gap-2'>
                          <button
                            type='button'
                            onClick={handleEditCategory}
                            className='rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700'
                          >
                            Lưu
                          </button>
                          <button
                            type='button'
                            onClick={() => setEditingCategory(null)}
                            className='rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100'
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel
