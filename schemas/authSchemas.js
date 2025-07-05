import Joi from 'joi';

export const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
  recaptchaToken: Joi.string().required(),
});

export const createUserSchema = Joi.object({
  username: Joi.string().min(3).required(),
  full_name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('customer', 'employee', 'admin').required(),
});

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

export const requestResetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordWithOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).required(),
});

export const updateEmployeeSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30),
  full_name: Joi.string().min(3).max(100),
  email: Joi.string().email(),
  password: Joi.string().min(6).max(100),
  is_active: Joi.boolean()
});