import Joi from 'joi';

export const depositSchema = Joi.object({
    account_number: Joi.string().required(),
    amount: Joi.number().positive().required(),
});