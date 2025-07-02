// app.js
import express from 'express';
import dotenv from 'dotenv';
import { sequelize } from './db.js';
import authRoutes from './routes/auth.routes.js';
import employeeRoutes from './routes/employees/employee.routes.js';
import accountRoutes from './routes/customers/account.routes.js';
import recipientRoutes from './routes/customers/recipients.routes.js';
import transferRoutes from './routes/customers/transfer.routes.js';
import debtRoutes from './routes/customers/debt.routes.js';
import historyRoutes from './routes/customers/history.routes.js'

dotenv.config();
const app = express();

app.use(express.json());
app.use('/auth', authRoutes);
app.use('/employee', employeeRoutes);
app.use('/customer', accountRoutes);
app.use('/customer', recipientRoutes);
app.use('/customer', transferRoutes);
app.use('/customer', debtRoutes);
app.use('/customer', historyRoutes);



// Test route
app.get('/', (req, res) => {
  res.send('Hi, Sequelize is working!');
});

// Kết nối DB
sequelize.authenticate()
  .then(() => {
    console.log('✅ Connect with database successfully!');
    app.listen(process.env.PORT || 3000, () => {
      console.log(`🚀 Server chạy tại http://localhost:${process.env.PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Lỗi kết nối DB:', err);
  });
