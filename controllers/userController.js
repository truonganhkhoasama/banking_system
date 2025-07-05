import { hash, compare } from 'bcrypt';
import jwt from 'jsonwebtoken';
import { models } from '../db.js'; // ✅ Import từ file db.js mà bạn đã config
import User from '../models/users.js'; // Adjust the import path to your actual model
import { createUserSchema, loginSchema } from '../schemas/authSchemas.js';

// Get all users
export async function getAllUsers(req, res) {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get user by ID
export async function getUserById(req, res) {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Create new user (register)
export async function createUser(req, res) {
  try {
    const { username, full_name, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) return res.status(400).json({ error: 'Email already in use' });

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) return res.status(400).json({ error: 'Username already taken' });

    const hashedPassword = await hash(password, 10);
    const newUser = await User.create({
      username,
      full_name,
      email,
      password: hashedPassword
    });

    const { password: _, ...userData } = newUser.toJSON();
    res.status(201).json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Update user
export async function updateUser(req, res) {
  try {
    const { full_name, email, password } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.full_name = full_name || user.full_name;
    user.email = email || user.email;
    if (password) {
      user.password = await hash(password, 10);
    }

    await user.save();
    const { password: _, ...userData } = user.toJSON();
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Delete user
export async function deleteUser(req, res) {
  try {
    const deleted = await User.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Login
export async function login(req, res) {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(404).json({ error: 'Invalid username or password' });

    const match = await compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid username or password' });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const { password: _, ...userData } = user.toJSON();
    res.json({ message: 'Login successful', token, user: userData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getAllEmployees(req, res) {
  try {
    const employees = await User.findAll({
      where: { role: 'employee' },
      attributes: { exclude: ['password'] }
    });

    return res.status(200).json({
      success: true,
      data: employees
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

export async function createEmployee(req, res) {
  try {
    const { username, full_name, email, password } = value;

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) return res.status(400).json({ error: 'Email already in use' });

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) return res.status(400).json({ error: 'Username already taken' });

    let hashedPassword;
    try {
      hashedPassword = await hash(password, 10);
    } catch (err) {
      return res.status(500).json({ error: 'Error hashing password' });
    }

    const newEmployee = await User.create({
      username,
      full_name,
      email,
      password: hashedPassword,
      role: 'employee' // fixed to employee
    });

    const { password: _, ...employeeData } = newEmployee.toJSON();
    res.status(201).json(employeeData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateEmployee(req, res) {
  try {
    const { id } = req.params;

    const employee = await User.findByPk(id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    if (employee.role !== 'employee') {
      return res.status(400).json({ error: 'User is not an employee' });
    }

    const { username, full_name, email, password, is_active } = req.body;

    // Check for duplicate email/username if they're changing
    if (email && email !== employee.email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    if (username && username !== employee.username) {
      const usernameExists = await User.findOne({ where: { username } });
      if (usernameExists) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    // Only hash password if it's being updated
    let updatedPassword = employee.password;
    if (password) {
      updatedPassword = await hash(password, 10);
    }

    await employee.update({
      username: username ?? employee.username,
      full_name: full_name ?? employee.full_name,
      email: email ?? employee.email,
      password: updatedPassword,
      is_active: is_active ?? employee.is_active,
    });

    const { password: _, ...employeeData } = employee.toJSON();
    res.status(200).json(employeeData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteEmployee(req, res) {
  try {
    const { id } = req.params;

    const deleted = await User.destroy({ where: { id, role: 'employee' } });
    if (!deleted) return res.status(404).json({ error: 'Employee not found' });

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
