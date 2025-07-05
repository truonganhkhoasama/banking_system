import Joi from 'joi';

export const queryAccountInfoSchema = Joi.object({
    account_number: Joi.string().required(),
    timestamp: Joi.number().required(),
    bank_code: Joi.string().required(),
    hash: Joi.string().required(),
    signature: Joi.string().required(),
});

export const depositSchema = Joi.object({
    account_number: Joi.string().required(),
    from_account_number: Joi.string().required(),
    amount: Joi.number().positive().required(),
    timestamp: Joi.number().required(),
    bank_code: Joi.string().required(),
    hash: Joi.string().required(),
    signature: Joi.string().required(),
    message: Joi.string().optional(),
});

export const externalTransferSchema = Joi.object({
    bank_code: Joi.string().required(),
    to_account_number: Joi.string().required(),
    amount: Joi.number().positive().required(),
    message: Joi.string().allow('').optional()
});

export const confirmExternalTransferSchema = Joi.object({
    bank_code: Joi.string().required(),
    to_account_number: Joi.string().required(),
    amount: Joi.number().positive().required(),
    otp_code: Joi.string().required(),
    message: Joi.string().allow('', null),
});