import React from "react";
import { toVN } from '../utils/categoryLabels'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// 🎨 Cố định màu cho từng danh mục
const CATEGORY_COLORS = {
  'Food': '#10b981',        // Green - Ăn uống
  'Transport': '#3b82f6',   // Blue - Đi lại
  'Shopping': '#ec4899',    // Pink - Mua sắm
  'Entertainment': '#8b5cf6', // Purple - Giải trí
  'Bills': '#ef4444',       // Red - Hóa đơn
  'Others': '#6b7280',      // Gray - Khác
}

function CategoryChart({ categoryTotal }) {
  // ✅ Gán màu cố định dựa trên tên danh mục
  const data = Object.entries(categoryTotal || {}).map(([name, value]) => ({
    name: toVN(name),
    value,
    color: CATEGORY_COLORS[name] || '#9ca3af', // Default gray nếu không tìm thấy
  }));

  return (  
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-6">
        Chi Tiêu Theo Danh Mục
      </h3>

      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
          >
            {/* ✅ Dùng item.color thay vì COLORS để đảm bảo khớp với data */}
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip  formatter={(value) => `${Number(value).toLocaleString('vi-VN')} đ`} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: item.color }}
            ></div>
            <span className="text-sm text-gray-700">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CategoryChart;
