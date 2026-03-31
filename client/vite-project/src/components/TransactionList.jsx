import { Receipt, Search, Edit2, Trash2 } from 'lucide-react'
import React from 'react'
import { categories as CATEGORY_LIST, toVN, formatVNDSmart } from '../utils/categoryLabels'

function TransactionList({
  expenses = [],
  onDelete = () => {},
  onEdit = () => {},
  searchTerm = '',
  setSearchTerm = () => {},
  filterCategory = 'All',
  setFilterCategory = () => {}
}) {
  const categories = CATEGORY_LIST

  const getCategoryColor = (category) => {
    const colors = {
      Food: '#10b981',
      Transport: '#3b82f6',
      Entertainment: '#05020eff',
      Entertainment: '#05020eff',
      Shopping: '#ec4899',
      Bills: '#ef4444',
      Others: '#6b7280',
    }
    return colors[category] || colors['Others']
  }

  const filteredExpenses = (expenses || []).filter((expense) => {
    const q = (searchTerm || '').toLowerCase()
    const desc = (expense.description || '').toLowerCase()
    const notes = (expense.notes || '').toLowerCase()

    const matchesSearch = q === '' || desc.includes(q) || notes.includes(q)
    const matchesCategory = filterCategory === 'All' || (expense.category === filterCategory)

    return matchesSearch && matchesCategory
  })

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)

  return (
    <div className='bg-white rounded-2xl p-6 shadow-lg border border-gray-100'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h3 className='text-xl font-bold text-gray-900'>Giao Dịch</h3>
          <p className='text-sm text-gray-500 mt-1'>
            Tổng: {filteredExpenses.length} giao dịch
          </p>
        </div>
        <div className='px-4 py-2 bg-gray-700 text-white rounded-full text-sm font-bold'>
          {formatVNDSmart(totalAmount)}
        </div>
      </div>

      {/* Search + Filter */}
      <div className='flex gap-4 mb-5'>
        <div className='flex-1 relative'>
          <Search className='absolute left-3 top-3.5 w-4 h-4 text-gray-400' />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            type='text'
            placeholder='Tìm kiếm.....'
            className='w-full px-4 pl-10 py-2 bg-gray-50 border-2 border-gray-200 
                       rounded-xl text-sm focus:outline-none focus:border-indigo-500'
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className='px-4 py-2.5 bg-gray-50 border-2 border-indigo-500 rounded-xl text-sm font-semibold 
                     text-gray-700 focus:outline-none focus:border-indigo-500 cursor-pointer'
        >
          <option value='All'>Tất cả</option>
          {categories.map((cat) => (
            <option value={cat.value} key={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>
      


      {/* Transaction List */}
      <div className='space-y-3 max-h-[480px] overflow-y-auto pr-2'>
        {/* Empty State */}
        {filteredExpenses.length === 0 ? (
          <div className='text-center py-16'>
            <div className='w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4'>
              <Receipt className='w-10 h-10 text-gray-400' />
            </div>
            <p className='text-gray-600 font-semibold'>
              Không tìm thấy giao dịch nào
            </p>
            <p className='text-sm text-gray-400 mt-1'>Thử các danh mục</p>
          </div>
        ) : (
          filteredExpenses.map((expense) => {
            const {
              _id,
              id, // some backends use id
              description = 'No description',
              amount = 0,
              category = 'Others',
              date,
              notes = ''
            } = expense

            const key = _id || id || `${description}-${amount}-${date}`

            const displayDate = date ? String(date).split('T')[0] : ''

            return (
              <div
                key={key}
                className='flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white 
                          hover:from-white hover:to-gray-50 border-2 border-gray-100 rounded-xl 
                          transition-all group'
              >
                <div className='w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm bg-gray-100'>
                  <div
                    className='w-2.5 h-2.5 rounded-full'
                    style={{ backgroundColor: getCategoryColor(category) }}
                  ></div>
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='flex items-start justify-between gap-3 mb-1'>
                    <h4 className='font-bold text-gray-900 truncate'>{description}</h4>
                    <span className='text-xl font-bold text-gray-900 whitespace-nowrap'>
                      {formatVNDSmart(Number(amount || 0))}
                    </span>
                  </div>
                  <div className='flex items-center gap-2 text-xs'>
                    <span
                      className='px-2.5 py-1 rounded-lg font-bold text-gray-700'
                      style={{ backgroundColor: '#f3f4f6' }}
                    >
                      {toVN(category)}
                    </span>
                    <span className='text-gray-400'>•</span>
                    <span className='text-gray-500 font-medium'>{displayDate}</span>
                    {notes ? (
                      <>
                        <span className='text-gray-400'>•</span>
                        <span className='text-gray-500'>{notes}</span>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className='flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all'>
                  <button
                    onClick={() => onEdit(expense)}
                    className='p-2.5 bg-indigo-500 text-white hover:bg-indigo-600 rounded-xl transition-all shadow-sm'
                    title='Edit'
                  >
                    <Edit2 className='w-4 h-4' strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => onDelete(_id || id)}
                    className='p-2.5 bg-red-500 text-white hover:bg-red-600 rounded-xl transition-all shadow-sm'
                    title='Delete'
                  >
                    <Trash2 className='w-4 h-4' strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default TransactionList
