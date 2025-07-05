import Joi from 'joi';

export const createRecipientSchema = Joi.object({
    account_number: Joi.string().required(),
    bank_code: Joi.string().optional().allow(null, ''),
    alias_name: Joi.string().max(50).required(),
});

export const updateRecipientSchema = Joi.object({
    alias_name: Joi.string().trim().max(50).required(),
});