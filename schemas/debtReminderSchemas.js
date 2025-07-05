import Joi from 'joi';

export const debtReminderSchema = Joi.object({
    to_account_number: Joi.string().required(),
    amount: Joi.number().positive().required(),
    description: Joi.string().max(255).optional()
});

export const confirmDebtPaymentSchema = Joi.object({
    otp_code: Joi.string().length(6).required()
});

export const cancelReminderSchema = Joi.object({
    reason: Joi.string().min(1).required().messages({
        'any.required': 'Cancel reason is required',
        'string.empty': 'Cancel reason cannot be empty'
    })
});