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
import adminRoutes from './routes/admins/admin.routes.js';
import bankRoutes from './routes/banks/bankIntegration.routes.js';

dotenv.config();
const app = express();

app.use(express.json());
app.use('/auth', authRoutes);
app.use('/employees', employeeRoutes);
app.use('/customers/accounts', accountRoutes);
app.use('/customers/recipients', recipientRoutes);
app.use('/customers/transfer', transferRoutes);
app.use('/customers/debt', debtRoutes);
app.use('/customers/history', historyRoutes);
app.use('/admin', adminRoutes);
app.use('/banks', bankRoutes);



// Test route
app.get('/', (req, res) => {
  res.send('Hi, Sequelize is working!');
});

sequelize.authenticate()
  .then(() => {
    console.log('Connect with database successfully!');
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server is running on http://localhost:${process.env.PORT}`);
    });
  })
  .catch(err => {
    console.error('Error:', err);
  });
