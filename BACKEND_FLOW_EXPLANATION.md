# 📋 Giải Thích Luồng Xử Lý Backend - Từ Frontend đến Database

## 🎯 Mục đích
Tài liệu này giải thích chi tiết cách một yêu cầu từ người dùng (frontend) được backend xử lý qua từng file, từ route → middleware → controller → model → database.

---

## 📡 Luồng Chung của Một Request

```
Frontend (React)
    ↓ gửi HTTP request
Client/Vite App (api.js)
    ↓ (ví dụ: POST /api/v2/auth/login)
app.js (Express app nhận request)
    ↓ match route
routes/ (xác định endpoint)
    ↓ nếu cần xác thực
middleware/authMiddleware.js (verify JWT token)
    ↓ nếu token hợp lệ
controller/ (xử lý logic chính)
    ↓ query/modify dữ liệu
models/ (Schema MongoDB, validation)
    ↓ communicate với
MongoDB Database
    ↓ trả dữ liệu về
controller (format response)
    ↓ trả JSON
Frontend (cập nhật UI)
```

---

## 🔐 **Chức năng 1: Đăng Ký (Register)**

### 👤 Người dùng thực hiện:
- Nhập tên, email, mật khẩu vào form trên trang Register
- Nhấn nút "Đăng Ký"

### 📊 Luồng request:

```
1️⃣ Frontend (React Component)
   File: client/vite-project/src/pages/Register.jsx
   └─ Gọi API: POST /api/v2/auth/register
      Body: { name, email, password }

2️⃣ app.js (Express Setup)
   File: server/app.js
   └─ app.use('/api/v2/auth', authRoute)
   └─ Nhận request → match với route `/register`

3️⃣ Routes (Định tuyến)
   File: server/routes/authRoute.js
   └─ router.post('/register', register)
   └─ Gọi hàm register từ authController

4️⃣ Middleware (Không cần trong trường hợp này)
   └─ Không có xác thực (public endpoint)

5️⃣ Controller (Xử lý logic)
   File: server/controller/authController.js
   └─ exports.register = async (req, res) => {
   │   ├─ const { name, email, password } = req.body
   │   ├─ Check email tồn tại: User.findOne({ email })
   │   ├─ Tạo user mới: User.create({ name, email, password })
   │   ├─ Generate tokens: generateToken() + generateRefreshToken()
   │   ├─ Lưu refreshToken: user.refreshToken = refreshToken; user.save()
   │   └─ Trả response: { token, refreshToken, user }
   │   }

6️⃣ Model (Schema + Validation)
   File: server/models/userModel.js
   └─ userSchema
      ├─ Validate: name required, email unique, password minlength 6
      ├─ Pre-save hook: hash password bằng bcryptjs
      └─ Methods: matchPassword()
   
   Khi User.create() hoặc user.save():
   ├─ Mongoose validate schema
   ├─ Trigger pre('save') → hash password
   └─ Lưu vào MongoDB collection 'users'

7️⃣ Database (MongoDB)
   └─ Lưu document vào collection: db.users
      {
        "_id": ObjectId,
        "name": "Nguyễn A",
        "email": "a@email.com",
        "password": "$2a$10$...(bcrypt hash)...",
        "avatar": null,
        "refreshToken": "eyJhbGc...",
        "createdAt": Date,
        "updatedAt": Date
      }

8️⃣ Response về Frontend
   └─ HTTP 201 Created
      {
        "success": true,
        "token": "eyJhbGc...(JWT access token)...",
        "refreshToken": "eyJhbGc...(JWT refresh token)...",
        "user": {
          "id": ObjectId,
          "name": "Nguyễn A",
          "email": "a@email.com",
          "avatar": null
        }
      }

9️⃣ Frontend nhận response
   └─ Lưu token vào localStorage/sessionStorage
   └─ Lưu user info vào state/context
   └─ Redirect tới trang Dashboard
```

### 📁 Files liên quan:
- `client/vite-project/src/pages/Register.jsx` — form đăng ký
- `client/vite-project/src/api.js` — gọi API
- `server/app.js` — mount auth routes
- `server/routes/authRoute.js` — định nghĩa `/register`
- `server/controller/authController.js` — hàm `register`
- `server/models/userModel.js` — User schema + pre-save hash
- `server/config/db.js` — kết nối MongoDB
- `.env` — `MONGODB_URI`, `JWT_SECRET`

---

## 🔑 **Chức năng 2: Đăng Nhập (Login)**

### 👤 Người dùng thực hiện:
- Nhập email, mật khẩu
- Nhấn "Đăng Nhập"

### 📊 Luồng request:

```
1️⃣ Frontend (React)
   File: client/vite-project/src/pages/Login.jsx
   └─ POST /api/v2/auth/login
      Body: { email, password }

2️⃣ app.js
   └─ Nhận request → route /api/v2/auth/login

3️⃣ Routes
   File: server/routes/authRoute.js
   └─ router.post('/login', login)

4️⃣ Middleware
   └─ KHÔNG CÓ (public endpoint)

5️⃣ Controller
   File: server/controller/authController.js
   └─ exports.login = async (req, res) => {
   │   ├─ const { email, password } = req.body
   │   ├─ Tìm user: User.findOne({ email }).select('+password')
   │   │   (select('+password') để lấy password dù được set select:false)
   │   ├─ So sánh mật khẩu: user.matchPassword(password)
   │   │   └─ dùng bcrypt.compare() từ userSchema.methods
   │   ├─ Tạo tokens: generateToken() + generateRefreshToken()
   │   ├─ Lưu refreshToken: user.refreshToken = refreshToken; user.save()
   │   └─ Trả response
   │   }

6️⃣ Model
   File: server/models/userModel.js
   └─ matchPassword(enteredPassword)
      └─ bcrypt.compare(enteredPassword, this.password)
      └─ return true/false

7️⃣ Database
   └─ Query: db.users.findOne({ email: "a@email.com" })
   └─ Compare password hash

8️⃣ Response
   └─ HTTP 200 OK
      {
        "success": true,
        "token": "eyJhbGc...",
        "refreshToken": "eyJhbGc...",
        "user": { id, name, email, avatar }
      }

9️⃣ Frontend
   └─ Lưu token vào localStorage
   └─ Mỗi request tiếp theo sẽ attach header: Authorization: Bearer <token>
```

### 📁 Files liên quan:
- `client/vite-project/src/pages/Login.jsx`
- `server/routes/authRoute.js`
- `server/controller/authController.js` — `login` function
- `server/models/userModel.js` — `matchPassword()` method
- `server/config/db.js` — MongoDB connection
- `.env`

---

## 👤 **Chức năng 3: Xem Hồ Sơ Người Dùng (Get Profile)**

### 👤 Người dùng thực hiện:
- Đã đăng nhập
- Vào trang "Thông tin cá nhân" hoặc nhấn avatar
- Frontend tự động gọi API lấy thông tin

### 📊 Luồng request:

```
1️⃣ Frontend (React)
   File: client/vite-project/src/components/UserProfile.jsx
       hoặc: client/vite-project/src/pages/Dashboard.jsx
   └─ GET /api/v2/auth/profile
      Header: Authorization: Bearer <access_token>

2️⃣ app.js
   └─ Nhận request → route /api/v2/auth/profile

3️⃣ Routes
   File: server/routes/authRoute.js
   └─ router.get('/profile', protect, getUserProfile)
   └─ Chú ý: 'protect' middleware

4️⃣ Middleware ⭐ (Bắt buộc)
   File: server/middleware/authMiddleware.js
   └─ exports.protect = async (req, res, next) => {
   │   ├─ Đọc header Authorization
   │   ├─ Extract token: "Bearer <token>"
   │   ├─ Xác thực: jwt.verify(token, process.env.JWT_SECRET)
   │   ├─ Lấy user từ decoded.id: User.findById(decoded.id).select('-password')
   │   ├─ Attach: req.user = user
   │   └─ next() → tiếp tục controller
   │   }
   │   
   │   Nếu token invalid → return 401
   │   Nếu token expired → return 401
   │   Nếu user không tồn tại → return 404

5️⃣ Controller
   File: server/controller/authController.js
   └─ exports.getUserProfile = async (req, res) => {
   │   ├─ const user = await User.findById(req.user.id)
   │   │   (req.user đã được attach từ middleware)
   │   ├─ Return user info: { id, name, email, avatar, createdAt, updatedAt }
   │   └─ }

6️⃣ Model
   File: server/models/userModel.js
   └─ Query: db.users.findById(ObjectId)

7️⃣ Database
   └─ MongoDB trả về user document

8️⃣ Response
   └─ HTTP 200 OK
      {
        "success": true,
        "user": {
          "id": ObjectId,
          "name": "Nguyễn A",
          "email": "a@email.com",
          "avatar": null,
          "createdAt": "2024-...",
          "updatedAt": "2024-..."
        }
      }

9️⃣ Frontend
   └─ Cập nhật UI với thông tin user
```

### 📁 Files liên quan:
- `client/vite-project/src/components/UserProfile.jsx` — hiển thị thông tin
- `client/vite-project/src/auth.js` — quản lý token
- `server/routes/authRoute.js` — route `/profile`
- **server/middleware/authMiddleware.js** — ⭐ bảo vệ route
- `server/controller/authController.js` — `getUserProfile`
- `server/models/userModel.js`

---

## 💰 **Chức năng 4: Tạo Chi Tiêu Mới (Create Expense)**

### 👤 Người dùng thực hiện:
- Tại trang Dashboard
- Nhập thông tin: mô tả, số tiền, danh mục, ngày
- Nhấn "Thêm chi tiêu"

### 📊 Luồng request:

```
1️⃣ Frontend (React)
   File: client/vite-project/src/pages/Dashboard.jsx
       hoặc: client/vite-project/src/components/Modal.jsx
   └─ POST /api/v2/expense
      Header: Authorization: Bearer <token>
      Body: {
        description: "Ăn trưa",
        amount: 50000,
        category: "Food",
        date: "2024-12-04",
        notes: "quán phở A"
      }

2️⃣ app.js
   └─ app.use('/api/v2/expense', expenseRoute)
   └─ Nhận request

3️⃣ Routes
   File: server/routes/expenseRoutes.js
   └─ router.route('/')
        .post(protect, expenseController.createExpense)

4️⃣ Middleware
   File: server/middleware/authMiddleware.js
   └─ protect middleware
   └─ Verify JWT token
   └─ Attach req.user
   └─ Nếu invalid → 401

5️⃣ Controller
   File: server/controller/expenseController.js
   └─ exports.createExpense = async (req, res) => {
   │   ├─ Validate date: không được cũ hơn 30 ngày
   │   ├─ const payload = {
   │   │   description: req.body.description,
   │   │   amount: req.body.amount,
   │   │   category: req.body.category,
   │   │   date: req.body.date || new Date(),
   │   │   notes: req.body.notes,
   │   │   userId: req.user._id  ⭐ (lấy từ middleware)
   │   │ }
   │   ├─ const expense = await Expense.create(payload)
   │   └─ Return: { success: true, data: expense }
   │   }

6️⃣ Model
   File: server/models/expenseModel.js
   └─ expenseSchema validation:
      ├─ description: required, max 100 chars
      ├─ amount: required, min 0.01
      ├─ category: enum [Food, Transport, Shopping, Entertainment, Bills, Others]
      ├─ date: default Date.now
      ├─ notes: max 500 chars
      ├─ userId: required, ref User
      └─ Pre-save hook: làm tròn amount 2 chữ số

   Mongoose validate schema → lưu vào DB

7️⃣ Database
   └─ MongoDB insert vào collection: db.expenses
      {
        "_id": ObjectId,
        "description": "Ăn trưa",
        "amount": 50000,
        "category": "Food",
        "date": ISODate("2024-12-04T..."),
        "notes": "quán phở A",
        "userId": ObjectId("...user_id..."),
        "createdAt": ISODate,
        "updatedAt": ISODate
      }

8️⃣ Response
   └─ HTTP 201 Created
      {
        "success": true,
        "data": { _id, description, amount, category, date, notes, userId, ... }
      }

9️⃣ Frontend
   └─ Nhận response → thêm expense vào danh sách
   └─ Cập nhật UI/chart
   └─ Close modal
```

### 📁 Files liên quan:
- `client/vite-project/src/pages/Dashboard.jsx` — form nhập
- `client/vite-project/src/components/Modal.jsx` — modal chi tiêu
- `client/vite-project/src/api.js` — gọi API
- `server/routes/expenseRoutes.js` — route POST /
- **server/middleware/authMiddleware.js** — xác thực
- `server/controller/expenseController.js` — `createExpense`
- `server/models/expenseModel.js` — Expense schema
- `server/config/db.js` — MongoDB

---

## 📊 **Chức năng 5: Lấy Danh Sách Chi Tiêu (Get All Expenses)**

### 👤 Người dùng thực hiện:
- Vào trang Dashboard
- Frontend tự động gọi API lấy chi tiêu của tháng hiện tại

### 📊 Luồng request:

```
1️⃣ Frontend
   File: client/vite-project/src/pages/Dashboard.jsx
   └─ GET /api/v2/expense
      Header: Authorization: Bearer <token>

2️⃣ app.js → Routes
   File: server/routes/expenseRoutes.js
   └─ router.get('/', protect, expenseController.getAllExpenses)

3️⃣ Middleware
   └─ protect → verify token → attach req.user

4️⃣ Controller
   File: server/controller/expenseController.js
   └─ exports.getAllExpenses = async (req, res) => {
   │   ├─ const expenses = await Expense.find({ userId: req.user.id })
   │   ├─ Return: { success: true, count, data: expenses }
   │   }

5️⃣ Model + Database
   └─ MongoDB query: db.expenses.find({ userId: ObjectId })
   └─ Trả về tất cả documents của user này

6️⃣ Response
   └─ HTTP 200 OK
      {
        "success": true,
        "count": 5,
        "data": [
          { _id, description, amount, category, date, ... },
          { _id, description, amount, category, date, ... },
          ...
        ]
      }

7️⃣ Frontend
   └─ Nhận response → cập nhật state/context
   └─ Render bảng danh sách chi tiêu
   └─ Cập nhật chart/biểu đồ
```

### 📁 Files liên quan:
- `client/vite-project/src/pages/Dashboard.jsx`
- `client/vite-project/src/components/TransactionList.jsx` — hiển thị danh sách
- `server/routes/expenseRoutes.js`
- `server/middleware/authMiddleware.js`
- `server/controller/expenseController.js` — `getAllExpenses`
- `server/models/expenseModel.js`

---

## 📈 **Chức năng 6: Báo Cáo Hàng Tháng (Monthly Report)**

### 👤 Người dùng thực hiện:
- Vào trang "Báo Cáo Hàng Tháng" (MonthlyReport.jsx)
- Chọn tháng/năm
- Frontend gọi API báo cáo

### 📊 Luồng request:

```
1️⃣ Frontend
   File: client/vite-project/src/pages/MonthlyReport.jsx
   └─ GET /api/v2/expense/reports/monthly?year=2024&month=12&monthlyLimit=5000000
      Header: Authorization: Bearer <token>
      Query params:
        - year: 2024
        - month: 12 (1-12)
        - monthlyLimit: 5000000 (định mức tháng)

2️⃣ app.js → Routes
   File: server/routes/expenseRoutes.js
   └─ router.get('/reports/monthly', protect, expenseController.getMonthlyReport)
   └─ Chú ý: route này PHẢI định nghĩa TRƯỚC /:id
      để tránh match sai (/reports/monthly bị hiểu là /:id)

3️⃣ Middleware
   └─ protect → verify token → attach req.user

4️⃣ Controller
   File: server/controller/expenseController.js
   └─ exports.getMonthlyReport = async (req, res) => {
   │   ├─ Parse query: year, month, monthlyLimit
   │   ├─ Tính khoảng ngày: start = 2024-12-01, end = 2025-01-01
   │   ├─ Aggregate pipeline:
   │   │   ├─ Match: userId = req.user._id AND date ∈ [start, end)
   │   │   ├─ Facet (3 nhánh song song):
   │   │   │   ├─ total: sum amount → tổng chi tiêu
   │   │   │   ├─ byCategory: group by category, sum → tổng theo danh mục (top)
   │   │   │   └─ byDay: group by day of month → tổng theo ngày
   │   │   └─ Return kết quả
   │   ├─ Calculate savingsRatio = (monthlyLimit - total) / monthlyLimit
   │   └─ Return: { total, topCategories, daily, savingsRatio, month, year }
   │   }

5️⃣ Model + Database
   File: server/models/expenseModel.js
   └─ MongoDB aggregation pipeline:
      1. $match: { userId, date in range }
      2. $facet: 
         - total: $group by null, $sum amount
         - byCategory: $group by category, $sum amount, $sort
         - byDay: $group by day, $sum amount, $sort
      
      Ví dụ kết quả:
      {
        "total": [{ "_id": null, "total": 1500000 }],
        "byCategory": [
          { "_id": "Food", "total": 500000 },
          { "_id": "Transport", "total": 300000 },
          { "_id": "Bills", "total": 700000 }
        ],
        "byDay": [
          { "_id": 1, "total": 50000 },
          { "_id": 2, "total": 60000 },
          { "_id": 4, "total": 45000 },
          ...
        ]
      }

6️⃣ Response
   └─ HTTP 200 OK
      {
        "success": true,
        "data": {
          "total": 1500000,
          "topCategories": [
            { "category": "Bills", "total": 700000 },
            { "category": "Food", "total": 500000 },
            { "category": "Transport", "total": 300000 }
          ],
          "daily": [
            { "day": 1, "total": 50000 },
            { "day": 2, "total": 60000 },
            ...
          ],
          "savingsRatio": 0.7,  // 70% tiết kiệm
          "month": 12,
          "year": 2024
        }
      }

7️⃣ Frontend
   File: client/vite-project/src/pages/MonthlyReport.jsx
   └─ Nhận response
   └─ Render charts (CategoryChart.jsx, SpendingChart.jsx)
   └─ Hiển thị: tổng chi, tỉ lệ tiết kiệm, top danh mục, biểu đồ chi theo ngày
```

### 📁 Files liên quan:
- `client/vite-project/src/pages/MonthlyReport.jsx` — page báo cáo
- `client/vite-project/src/components/CategoryChart.jsx` — biểu đồ danh mục
- `client/vite-project/src/components/SpendingChart.jsx` — biểu đồ chi tiêu
- `client/vite-project/src/components/StatCard.jsx` — card thống kê
- `server/routes/expenseRoutes.js`
- `server/middleware/authMiddleware.js`
- `server/controller/expenseController.js` — `getMonthlyReport`
- `server/models/expenseModel.js`

---

## 🔄 **Chức năng 7: Cập Nhật Chi Tiêu (Update Expense)**

### 👤 Người dùng thực hiện:
- Trên Dashboard hoặc danh sách chi tiêu
- Nhấn nút "Sửa" chi tiêu
- Thay đổi thông tin (mô tả, số tiền, danh mục, ngày)
- Nhấn "Lưu" hoặc "Cập nhật"

### 📊 Luồng request:

```
1️⃣ Frontend
   File: client/vite-project/src/pages/Dashboard.jsx
       hoặc: client/vite-project/src/components/Modal.jsx
   └─ PUT /api/v2/expense/:id
      Header: Authorization: Bearer <token>
      Body: {
        description: "Ăn trưa - quán phở B",
        amount: 55000,
        category: "Food",
        date: "2024-12-04",
        notes: "phở gà tại Q1"
      }

2️⃣ Routes
   File: server/routes/expenseRoutes.js
   └─ router.route('/:id')
        .put(protect, expenseController.updateExpense)

3️⃣ Middleware
   └─ protect → verify token → attach req.user

4️⃣ Controller
   File: server/controller/expenseController.js
   └─ exports.updateExpense = async (req, res) => {
   │   ├─ Nếu cập nhật date: validate không quá 30 ngày
   │   ├─ const updatedExpense = await Expense.findByIdAndUpdate(
   │   │     req.params.id,
   │   │     req.body,
   │   │     { new: true, runValidators: true }
   │   │   )
   │   │   (new: true → trả document sau khi update)
   │   │   (runValidators: true → validate lại schema)
   │   ├─ if (!updatedExpense) → 404 not found
   │   └─ Return: { success: true, data: updatedExpense }
   │   }

5️⃣ Model + Database
   └─ MongoDB update:
      db.expenses.findByIdAndUpdate(ObjectId, { ... }, { new: true })

6️⃣ Response
   └─ HTTP 200 OK
      {
        "success": true,
        "data": { _id, description, amount, category, date, ..., updatedAt }
      }

7️⃣ Frontend
   └─ Cập nhật state danh sách chi tiêu
   └─ Đóng modal
   └─ Cập nhật UI/chart
```

### 📁 Files liên quan:
- `client/vite-project/src/pages/Dashboard.jsx`
- `server/routes/expenseRoutes.js`
- `server/middleware/authMiddleware.js`
- `server/controller/expenseController.js` — `updateExpense`
- `server/models/expenseModel.js`

---

## 🗑️ **Chức năng 8: Xóa Chi Tiêu (Delete Expense)**

### 👤 Người dùng thực hiện:
- Nhấn nút "Xóa" trên chi tiêu
- Xác nhận xóa

### 📊 Luồng request:

```
1️⃣ Frontend
   └─ DELETE /api/v2/expense/:id
      Header: Authorization: Bearer <token>

2️⃣ Routes
   File: server/routes/expenseRoutes.js
   └─ router.route('/:id')
        .delete(protect, expenseController.delete)

3️⃣ Middleware
   └─ protect

4️⃣ Controller
   File: server/controller/expenseController.js
   └─ exports.delete = async (req, res) => {
   │   ├─ const deleted = await Expense.findByIdAndDelete(req.params.id)
   │   ├─ if (!deleted) → 404
   │   └─ Return: { success: true, message: 'Deleted successfully' }
   │   }

5️⃣ Database
   └─ MongoDB delete: db.expenses.findByIdAndDelete(ObjectId)

6️⃣ Response
   └─ HTTP 200 OK
      { "success": true, "message": "Expense deleted successfully" }

7️⃣ Frontend
   └─ Remove khỏi danh sách
   └─ Cập nhật UI/chart
```

---

## 🔐 **Chức năng 9: Đổi Mật Khẩu (Change Password)**

### 👤 Người dùng thực hiện:
- Vào Settings / Đổi mật khẩu
- Nhập mật khẩu cũ, mật khẩu mới (2 lần)
- Nhấn "Đổi mật khẩu"

### 📊 Luồng request:

```
1️⃣ Frontend
   File: client/vite-project/src/components/ChangePassword.jsx
   └─ PUT /api/v2/auth/change-password
      Header: Authorization: Bearer <token>
      Body: {
        currentPassword: "old123",
        newPassword: "new456",
        confirmPassword: "new456"
      }

2️⃣ Routes
   File: server/routes/authRoute.js
   └─ router.put('/change-password', protect, changePassword)

3️⃣ Middleware
   └─ protect → verify token → attach req.user

4️⃣ Controller
   File: server/controller/authController.js
   └─ exports.changePassword = async (req, res) => {
   │   ├─ Validate: tất cả field bắt buộc
   │   ├─ Validate: newPassword === confirmPassword
   │   ├─ Validate: newPassword.length >= 6
   │   ├─ const user = User.findById(req.user.id).select('+password')
   │   ├─ Verify mật khẩu hiện tại: user.matchPassword(currentPassword)
   │   │   └─ dùng bcrypt.compare
   │   ├─ if (!isPasswordCorrect) → 401 Unauthorized
   │   ├─ Update: user.password = newPassword
   │   ├─ Save: user.save()
   │   │   └─ trigger pre('save') → hash password mới
   │   └─ Return: { success: true, message: '...' }
   │   }

5️⃣ Model + Database
   └─ User.findById & save
   └─ Pre-save hook: hash password mới

6️⃣ Response
   └─ HTTP 200 OK
      { "success": true, "message": "Password changed successfully" }

7️⃣ Frontend
   └─ Thông báo thành công
   └─ Có thể yêu cầu đăng nhập lại
```

### 📁 Files liên quan:
- `client/vite-project/src/components/ChangePassword.jsx`
- `server/routes/authRoute.js`
- `server/middleware/authMiddleware.js`
- `server/controller/authController.js` — `changePassword`
- `server/models/userModel.js` — `matchPassword()` method

---

## 📝 **Chức năng 10: Cập Nhật Hồ Sơ (Update Profile)**

### 👤 Người dùng thực hiện:
- Vào trang "Thông tin cá nhân"
- Thay đổi tên, upload ảnh đại diện
- Nhấn "Lưu"

### 📊 Luồng request:

```
1️⃣ Frontend
   File: client/vite-project/src/components/EditProfile.jsx
   └─ PUT /api/v2/auth/update-profile
      Header: Authorization: Bearer <token>
      Body: {
        name: "Nguyễn Văn B",
        avatar: "data:image/png;base64,iVBORw0K..." (optional, base64)
      }

2️⃣ Routes
   File: server/routes/authRoute.js
   └─ router.put('/update-profile', protect, updateProfile)

3️⃣ Middleware
   └─ protect

4️⃣ Controller
   File: server/controller/authController.js
   └─ exports.updateProfile = async (req, res) => {
   │   ├─ const { name, avatar } = req.body
   │   ├─ Validate: name không trống
   │   ├─ const user = User.findById(req.user.id)
   │   ├─ if (name) user.name = name
   │   ├─ if (avatar && avatar.length > 0 && avatar.length <= 1MB)
   │   │   user.avatar = avatar
   │   ├─ user.save()
   │   └─ Return: { success: true, message: '...', user: {...} }
   │   }

5️⃣ Model + Database
   └─ User update & save

6️⃣ Response
   └─ HTTP 200 OK
      {
        "success": true,
        "message": "Profile updated successfully",
        "user": { id, name, email, avatar }
      }

7️⃣ Frontend
   └─ Cập nhật user state
   └─ Refresh avatar trên giao diện
```

### 📁 Files liên quan:
- `client/vite-project/src/components/EditProfile.jsx`
- `server/routes/authRoute.js`
- `server/middleware/authMiddleware.js`
- `server/controller/authController.js` — `updateProfile`
- `server/models/userModel.js`

---

## 🔄 **Chức năng 11: Refresh Token (Lấy Access Token Mới)**

### 👤 Khi nào sử dụng:
- Access token hết hạn (hoặc sắp hết)
- Frontend tự động gọi API để lấy token mới mà không cần user đăng nhập lại

### 📊 Luồng request:

```
1️⃣ Frontend
   File: client/vite-project/src/auth.js
   └─ POST /api/v2/auth/refresh-token
      Body: { refreshToken: "eyJhbGc..." }

2️⃣ Routes
   File: server/routes/authRoute.js
   └─ router.post('/refresh-token', refreshToken)
   └─ Chú ý: KHÔNG có protect middleware (public endpoint)

3️⃣ Controller
   File: server/controller/authController.js
   └─ exports.refreshToken = async (req, res) => {
   │   ├─ const { refreshToken } = req.body
   │   ├─ if (!refreshToken) → 401
   │   ├─ Xác thực refresh token: jwt.verify(refreshToken, JWT_REFRESH_SECRET)
   │   ├─ if (TokenExpiredError) → 401 Refresh token expired
   │   ├─ if (invalid) → 401 Invalid refresh token
   │   ├─ Tìm user có refreshToken này: User.findOne({ refreshToken })
   │   │   .select('+refreshToken')
   │   ├─ Kiểm tra: user.refreshToken === refreshToken (so khớp)
   │   ├─ Nếu không khớp → 403 Forbidden
   │   ├─ Generate access token mới: const token = generateToken(user._id)
   │   └─ Return: { success: true, token: "new access token" }
   │   }

4️⃣ Model + Database
   └─ User query by refreshToken

5️⃣ Response
   └─ HTTP 200 OK
      {
        "success": true,
        "token": "eyJhbGc...(new access token)..."
      }

6️⃣ Frontend
   └─ Lưu token mới vào localStorage
   └─ Attach header Authorization: Bearer <token mới>
   └─ Retry request cũ
```

### 📁 Files liên quan:
- `client/vite-project/src/auth.js` — token management
- `server/routes/authRoute.js`
- `server/controller/authController.js` — `refreshToken`
- `server/models/userModel.js`

---

## 🚪 **Chức năng 12: Đăng Xuất (Logout)**

### 👤 Người dùng thực hiện:
- Nhấn nút "Đăng Xuất"

### 📊 Luồng request:

```
1️⃣ Frontend
   File: client/vite-project/src/components/UserMenu.jsx
   └─ POST /api/v2/auth/logout
      Body: { refreshToken: "eyJhbGc..." }

2️⃣ Routes
   File: server/routes/authRoute.js
   └─ router.post('/logout', logout)

3️⃣ Controller
   File: server/controller/authController.js
   └─ exports.logout = async (req, res) => {
   │   ├─ const { refreshToken } = req.body
   │   ├─ if (!refreshToken) → 400 Required
   │   ├─ Tìm user: User.findOne({ refreshToken })
   │   ├─ Nếu tìm thấy:
   │   │   ├─ user.refreshToken = null
   │   │   └─ user.save()
   │   │   └─ (revoke token bằng cách set null)
   │   └─ Return: { success: true, message: 'Logged out successfully' }
   │   }

4️⃣ Response
   └─ HTTP 200 OK
      { "success": true, "message": "Logged out successfully" }

5️⃣ Frontend
   └─ Xóa token từ localStorage
   └─ Xóa user state
   └─ Redirect tới trang Login
```

### 📁 Files liên quan:
- `client/vite-project/src/components/UserMenu.jsx`
- `client/vite-project/src/auth.js`
- `server/routes/authRoute.js`
- `server/controller/authController.js` — `logout`
- `server/models/userModel.js`

---

## 📋 **Tóm Tắt: Từ Frontend → Backend → Database**

| Chức năng | Frontend | Route | Middleware | Controller | Model | Database |
|-----------|----------|-------|-----------|------------|-------|----------|
| **Đăng Ký** | Register.jsx | POST /register | ❌ | register() | User.create() | insert user |
| **Đăng Nhập** | Login.jsx | POST /login | ❌ | login() | User.findOne() | query user |
| **Xem Hồ Sơ** | UserProfile.jsx | GET /profile | ✅ protect | getUserProfile() | User.findById() | query user |
| **Tạo Chi Tiêu** | Modal.jsx | POST /expense | ✅ protect | createExpense() | Expense.create() | insert expense |
| **Lấy Chi Tiêu** | Dashboard.jsx | GET /expense | ✅ protect | getAllExpenses() | Expense.find() | query expenses |
| **Báo Cáo Tháng** | MonthlyReport.jsx | GET /reports/monthly | ✅ protect | getMonthlyReport() | Expense.aggregate() | aggregate |
| **Cập Nhật Chi Tiêu** | Modal.jsx | PUT /expense/:id | ✅ protect | updateExpense() | Expense.findByIdAndUpdate() | update |
| **Xóa Chi Tiêu** | Dashboard.jsx | DELETE /expense/:id | ✅ protect | delete() | Expense.findByIdAndDelete() | delete |
| **Đổi Mật Khẩu** | ChangePassword.jsx | PUT /change-password | ✅ protect | changePassword() | User.findById() + save | update |
| **Cập Nhật Hồ Sơ** | EditProfile.jsx | PUT /update-profile | ✅ protect | updateProfile() | User.findById() + save | update |
| **Refresh Token** | auth.js | POST /refresh-token | ❌ | refreshToken() | User.findOne() | query |
| **Đăng Xuất** | UserMenu.jsx | POST /logout | ❌ | logout() | User.findOne() + save | update |

---

## 🗂️ **Cấu Trúc Thư Mục Backend**

```
server/
├── app.js                      # Cấu hình Express app, mount routes
├── server.js                   # Entry point, kết nối DB, start server
├── package.json                # Dependencies
├── .env                        # Biến môi trường (MongoDB URI, JWT secret, port)
├── config/
│   └── db.js                   # Kết nối MongoDB
├── routes/
│   ├── authRoute.js            # Routes cho auth & user
│   └── expenseRoutes.js        # Routes cho expense
├── controller/
│   ├── authController.js       # Logic: register, login, profile, password, refresh token
│   └── expenseController.js    # Logic: CRUD expense, báo cáo
├── models/
│   ├── userModel.js            # User schema: name, email, password, avatar, budget data
│   └── expenseModel.js         # Expense schema: description, amount, category, date, userId
├── middleware/
│   └── authMiddleware.js       # Middleware: verify JWT token, attach user
├── utils/                      # Helper functions (nếu có)
└── node_modules/               # Dependencies
```

---

## 🔑 **Key Points - Những Điểm Quan Trọng**

1. **JWT Token Flow:**
   - Access token: ngắn hạn (30 ngày), dùng để gọi API bảo vệ
   - Refresh token: dài hạn, lưu trong DB user, dùng để lấy access token mới
   - Middleware `protect` check access token ở header Authorization

2. **User Isolation:**
   - Expense phải gắn với `userId` (từ middleware attach req.user)
   - Tất cả query chi tiêu phải filter theo `userId` để bảo mật

3. **Validation:**
   - Schema validation: Mongoose schema validate kiểu dữ liệu, required, enum, etc.
   - Controller validation: date window (30 ngày), password strength, base64 size, etc.
   - Pre-save hooks: hash password, làm tròn amount

4. **Route Order:**
   - Routes cụ thể (ví dụ `/reports/monthly`) phải định nghĩa TRƯỚC route parameter (`:id`)
   - Nếu không, `/reports/monthly` sẽ match `:id` = "reports" và thất bại

5. **Error Handling:**
   - Try-catch ở controller
   - Return JSON với `success: true/false` và message
   - HTTP status: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found), 500 (Server Error)

6. **Database Queries:**
   - Find: `User.findOne()`, `Expense.find()`
   - Insert: `Expense.create()`
   - Update: `User.findByIdAndUpdate()`, `user.save()`
   - Delete: `Expense.findByIdAndDelete()`
   - Aggregate: `Expense.aggregate()` cho báo cáo phức tạp

---

**Hy vọng tài liệu này giúp bạn hiểu rõ cấu trúc backend và luồng xử lý từng chức năng! 🚀**
