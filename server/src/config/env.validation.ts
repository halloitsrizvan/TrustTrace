import Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  DATABASE_URL: Joi.string().uri().required(),
  DIRECT_URL: Joi.string().uri().required(),
  SUPABASE_URL: Joi.string().uri().required(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().min(20).required(),
  SUPABASE_BUCKET: Joi.string().min(1).required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
  CORS_ORIGINS: Joi.string().min(1).required(),
  EMBEDDING_PROVIDER: Joi.string().valid('gemini', 'mock').required(),
  EMBEDDING_API_KEY: Joi.when('EMBEDDING_PROVIDER', {
    is: 'gemini',
    // oxlint-disable-next-line unicorn/no-thenable -- `then` is Joi's API.
    then: Joi.string().min(1).required(),
    otherwise: Joi.string().allow('').optional(),
  }),
  EMBEDDING_MODEL: Joi.string().min(1).required(),
  VISION_MODEL: Joi.string().min(1).required(),
  EMBEDDING_DIM: Joi.number().integer().positive().default(768),
  PORT: Joi.number().port().default(3000),
  PAYMENT_PROVIDER: Joi.string().valid('mock', 'razorpay').default('mock'),
  PAYMENT_KEY_ID: Joi.string().allow('').optional(),
  PAYMENT_KEY_SECRET: Joi.string().allow('').optional(),
  PAYMENT_WEBHOOK_SECRET: Joi.string().allow('').optional(),
});
