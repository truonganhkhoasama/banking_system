import Joi from 'joi';

export const initiateTransferSchema = Joi.object({
    to_account_number: Joi.string().required(),
    amount: Joi.number().positive().precision(2).required(),
    message: Joi.string().allow(''),
    fee_payer: Joi.string().valid('sender', 'receiver').required(),
});

export const confirmTransferSchema = Joi.object({
    to_account_number: Joi.string().required(),
    amount: Joi.number().positive().precision(2).required(),
    otp_code: Joi.string().length(6).required(),
    message: Joi.string().allow(''),
    fee_payer: Joi.string().valid('sender', 'receiver').required(),
});