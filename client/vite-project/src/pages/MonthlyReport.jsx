import React, { useEffect, useState } from 'react'
import { getMonthlyReport, fetchData } from '../api'
import { toVN } from '../utils/categoryLabels'
import { useNavigate } from 'react-router-dom'

const formatVND = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

export default function MonthlyReport() {
  const navigate = useNavigate()
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Yearly summary computed client-side
  const [yearlySummary, setYearlySummary] = useState([])

  const monthlyLimit = Number(localStorage.getItem('monthlyLimit')) || null

  useEffect(() => {
    load()
  }, [month, year])

  // Recompute yearly summary when year changes or monthlyLimits change
  useEffect(() => {
    loadYearlySummary()
  }, [year])

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await getMonthlyReport(month, year, monthlyLimit)
      setData(res)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi tải báo cáo')
    } finally {
      setLoading(false)
    }
  }

  const loadYearlySummary = async () => {
    try {
      // Fetch all expenses and aggregate by month for the selected year
      const all = await fetchData()
      const monthlyTotals = Array.from({ length: 12 }).map(() => 0)
      const monthlyCounts = Array.from({ length: 12 }).map(() => 0)

      all.forEach((e) => {
        const d = e?.date ? new Date(e.date) : null
        if (!d || isNaN(d.getTime())) return
        const y = d.getFullYear()
        if (y !== Number(year)) return
        const m = d.getMonth() // 0..11
        monthlyTotals[m] += Number(e.amount || 0)
        monthlyCounts[m] += 1
      })

      // Read per-month limits from localStorage (key: monthlyLimits JSON)
      // If a month does not have a defined monthly limit, keep it as `null` (meaning "not set")
      let monthlyLimits = {}
      try {
        monthlyLimits = JSON.parse(localStorage.getItem('monthlyLimits')) || {}
      } catch (e) {
        monthlyLimits = {}
      }

      const rows = monthlyTotals.map((spent, idx) => {
        const m = idx + 1
        const key = `${year}-${String(m).padStart(2, '0')}`
        const limit = monthlyLimits.hasOwnProperty(key) ? Number(monthlyLimits[key]) : null
        const diff = limit !== null ? limit - spent : null // null = no limit set
        const saved = limit !== null ? Math.max(0, limit - spent) : null
        const count = monthlyCounts[idx]
        return { month: m, spent, limit, diff, count, saved }
      })

      setYearlySummary(rows)
    } catch (err) {
      console.error('Error loading yearly summary', err)
    }
  }

  return (
    <div className='max-w-6xl mx-auto px-6 py-8'>
      <div className='flex items-center justify-between mb-6'>
        <h2 className='text-2xl font-bold'>Báo Cáo Tháng</h2>
        <div className='flex items-center gap-3'>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className='px-3 py-2 border rounded'>
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i + 1}>{`Tháng ${i + 1}`}</option>
            ))}
          </select>
          <input type='number' value={year} onChange={(e) => setYear(Number(e.target.value))} className='px-3 py-2 border rounded w-28' />
          <button onClick={() => navigate('/dashboard')} className='px-4 py-2 bg-gray-200 rounded'>Quay lại</button>
        </div>
      </div>

      {loading && <p>Đang tải...</p>}
      {error && <div className='text-red-600 mb-4'>{error}</div>}

      {data && (
        <div className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='p-4 bg-white rounded shadow'>
              <h3 className='text-sm text-gray-500'>Tổng chi (tháng)</h3>
              <p className='text-2xl font-bold'>{formatVND(data.total)}</p>
            </div>
            <div className='p-4 bg-white rounded shadow'>
              <h3 className='text-sm text-gray-500'>Tỉ lệ tiết kiệm</h3>
              <p className='text-2xl font-bold'>
                {data.savingsRatio === null ? 'N/A' : `${Math.round(data.savingsRatio * 100)}%`}
              </p>
            </div>
            <div className='p-4 bg-white rounded shadow'>
              <h3 className='text-sm text-gray-500'>Thời gian</h3>
              <p className='text-2xl font-bold'>Tháng {data.month} / {data.year}</p>
            </div>
          </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='p-4 bg-white rounded shadow'>
              <h3 className='font-semibold mb-3'>Top danh mục tốn tiền nhất</h3>
              {data.topCategories.length === 0 && <p>Không có dữ liệu</p>}
              <ul className='space-y-2'>
                {data.topCategories.map((c) => (
                  <li key={c.category} className='flex justify-between'>
                    <span>{toVN(c.category)}</span>
                    <strong>{formatVND(c.total)}</strong>
                  </li>
                ))}
              </ul>
            </div>

            <div className='p-4 bg-white rounded shadow'>
              <h3 className='font-semibold mb-3'>Chi theo ngày</h3>
              {data.daily.length === 0 && <p>Không có dữ liệu</p>}
              <div className='max-h-64 overflow-auto'>
                <table className='w-full text-left'>
                  <thead>
                    <tr className='text-sm text-gray-500 border-b'>
                      <th className='py-2'>Ngày</th>
                      <th className='py-2'>Tổng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.daily.map((d) => (
                      <tr key={d.day} className='border-b'>
                        <td className='py-2'>{d.day}</td>
                        <td className='py-2'>{formatVND(d.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Báo cáo năm (tính toán client-side) - hiển thị độc lập */}
      <div className='mt-8 p-4 bg-white rounded shadow'>
        <h3 className='text-lg font-semibold mb-3'>Báo Cáo Năm {year}</h3>
        <div className='max-h-96 overflow-auto'>
          <table className='w-full text-left'>
            <thead>
              <tr className='text-sm text-gray-500 border-b bg-gray-50'>
                <th className='py-2 px-2'>Tháng</th>
                <th className='py-2 px-2 text-right'>Số Tiền Đã Chi</th>
                <th className='py-2 px-2 text-right'>Định Mức Tháng</th>
                <th className='py-2 px-2 text-right'>Tiết Kiệm</th>
                <th className='py-2 px-2 text-right'>Vượt Quá Định Mức</th>
                <th className='py-2 px-2 text-right'>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
                  {yearlySummary.map((r) => {
                    const exceeded = r.limit !== null ? Math.max(0, r.spent - r.limit) : 0
                    const percentage = r.limit !== null && r.limit > 0 ? Math.round((r.spent / r.limit) * 100) : 0
                    const saved = r.limit !== null ? Math.max(0, r.limit - r.spent) : null
                    let statusColor = 'text-gray-400'
                    let statusText = '—'

                    if (r.limit !== null) {
                      // Only compute status when a limit exists
                      if (percentage > 100) {
                        statusColor = 'text-red-600'
                        statusText = '✗ Vượt quá'
                      } else if (percentage > 80) {
                        statusColor = 'text-orange-600'
                        statusText = '⚠ Gần hết'
                      } else {
                        statusColor = 'text-green-600'
                        statusText = '✓ Ok'
                      }
                    }

                    return (
                      <tr key={r.month} className='border-b hover:bg-gray-50'>
                        <td className='py-2 px-2 font-semibold'>Tháng {r.month}</td>
                        <td className='py-2 px-2 text-right'>{formatVND(r.spent)}</td>
                        <td className='py-2 px-2 text-right'>{r.limit !== null ? formatVND(r.limit) : '—'}</td>
                        <td className={`py-2 px-2 text-right font-semibold ${saved !== null && saved > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                          {saved !== null ? formatVND(saved) : '—'}
                        </td>
                        <td className={`py-2 px-2 text-right font-semibold ${exceeded > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {r.limit !== null && exceeded > 0 ? formatVND(exceeded) : '—'}
                        </td>
                        <td className={`py-2 px-2 text-right font-semibold ${statusColor}`}>
                          {statusText}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className='font-bold bg-blue-50 border-t-2 border-gray-300'>
                    <td className='py-2 px-2'>TỔNG NĂM</td>
                    <td className='py-2 px-2 text-right'>{formatVND(yearlySummary.reduce((s, r) => s + (r.limit !== null ? r.spent : 0), 0))}</td>
                    <td className='py-2 px-2 text-right'>{formatVND(yearlySummary.reduce((s, r) => s + (r.limit !== null ? r.limit : 0), 0))}</td>
                    <td className='py-2 px-2 text-right text-green-600'>{formatVND(yearlySummary.reduce((s, r) => s + (r.limit !== null ? Math.max(0, r.limit - r.spent) : 0), 0))}</td>
                    <td className='py-2 px-2 text-right text-red-600'>{formatVND(yearlySummary.reduce((s, r) => s + (r.limit !== null ? Math.max(0, r.spent - r.limit) : 0), 0))}</td>
                    <td className='py-2 px-2 text-right'>
                      {(() => {
                        const totalLimit = yearlySummary.reduce((s, r) => s + (r.limit !== null ? r.limit : 0), 0)
                        const totalSaved = yearlySummary.reduce((s, r) => s + (r.limit !== null ? Math.max(0, r.limit - r.spent) : 0), 0)
                        return totalLimit > 0 ? `${Math.round((totalSaved / totalLimit) * 100)}%` : '—'
                      })()}
                    </td>
                  </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
