import Joi from 'joi';

export const debtReminderSchema = Joi.object({
    toUserId: Joi.number().integer().required(),
    amount: Joi.number().positive().required(),
    description: Joi.string().max(255).optional()
});

export const confirmDebtPaymentSchema = Joi.object({
    otp_code: Joi.string().length(6).required()
});