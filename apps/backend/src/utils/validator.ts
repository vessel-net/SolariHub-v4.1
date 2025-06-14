import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './errors';

// Custom validation schemas
export const commonSchemas = {
  uuid: Joi.string().uuid(),
  email: Joi.string().email().lowercase(),
  password: Joi.string().min(8).pattern(new RegExp('(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)')),
  phone: Joi.string().pattern(new RegExp('^[+]?[1-9]\\d{1,14}$')),
  url: Joi.string().uri(),
  positiveInteger: Joi.number().integer().positive(),
  nonEmptyString: Joi.string().trim().min(1),
  dateString: Joi.string().isoDate(),
};

// User validation schemas
export const userValidation = {
  register: Joi.object({
    email: commonSchemas.email.required(),
    password: commonSchemas.password.required(),
    firstName: commonSchemas.nonEmptyString.required(),
    lastName: commonSchemas.nonEmptyString.required(),
    role: Joi.string().valid('buyer', 'seller', 'logistics', 'finance').required(),
    companyName: Joi.string().trim().when('role', {
      is: Joi.valid('seller', 'logistics', 'finance'),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    phone: commonSchemas.phone.optional(),
    address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().required(),
      country: Joi.string().required(),
    }).optional(),
  }),

  login: Joi.object({
    email: commonSchemas.email.required(),
    password: Joi.string().required(),
  }),

  updateProfile: Joi.object({
    firstName: commonSchemas.nonEmptyString.optional(),
    lastName: commonSchemas.nonEmptyString.optional(),
    companyName: Joi.string().trim().optional(),
    phone: commonSchemas.phone.optional(),
    address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().required(),
      country: Joi.string().required(),
    }).optional(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: commonSchemas.password.required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required(),
  }),
};

// Product validation schemas
export const productValidation = {
  create: Joi.object({
    name: commonSchemas.nonEmptyString.required(),
    description: Joi.string().trim().min(10).required(),
    categoryId: commonSchemas.uuid.required(),
    price: Joi.number().positive().precision(2).required(),
    currency: Joi.string().length(3).uppercase().default('USD'),
    inventoryCount: commonSchemas.positiveInteger.required(),
    specifications: Joi.object().optional(),
    certifications: Joi.array().items(Joi.string()).optional(),
    carbonFootprint: Joi.number().positive().precision(2).optional(),
    energyRating: Joi.string().valid('A+++', 'A++', 'A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G').optional(),
    images: Joi.array().items(Joi.string().uri()).max(10).optional(),
  }),

  update: Joi.object({
    name: commonSchemas.nonEmptyString.optional(),
    description: Joi.string().trim().min(10).optional(),
    categoryId: commonSchemas.uuid.optional(),
    price: Joi.number().positive().precision(2).optional(),
    currency: Joi.string().length(3).uppercase().optional(),
    inventoryCount: commonSchemas.positiveInteger.optional(),
    specifications: Joi.object().optional(),
    certifications: Joi.array().items(Joi.string()).optional(),
    carbonFootprint: Joi.number().positive().precision(2).optional(),
    energyRating: Joi.string().valid('A+++', 'A++', 'A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G').optional(),
    images: Joi.array().items(Joi.string().uri()).max(10).optional(),
    status: Joi.string().valid('active', 'inactive', 'discontinued').optional(),
  }),

  query: Joi.object({
    categoryId: commonSchemas.uuid.optional(),
    minPrice: Joi.number().positive().optional(),
    maxPrice: Joi.number().positive().optional(),
    search: Joi.string().trim().optional(),
    page: commonSchemas.positiveInteger.default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('name', 'price', 'createdAt', 'rating').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),
};

// Order validation schemas
export const orderValidation = {
  create: Joi.object({
    items: Joi.array().items(
      Joi.object({
        productId: commonSchemas.uuid.required(),
        quantity: commonSchemas.positiveInteger.required(),
        price: Joi.number().positive().precision(2).required(),
      })
    ).min(1).required(),
    shippingAddress: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().required(),
      country: Joi.string().required(),
    }).required(),
    paymentMethod: Joi.string().valid('stripe', 'paypal', 'crypto').required(),
    notes: Joi.string().trim().optional(),
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled').required(),
    notes: Joi.string().trim().optional(),
  }),
};

// Generic validation middleware factory
export const validate = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message.replace(/"/g, ''))
        .join(', ');
      
      throw new ValidationError(`Validation failed: ${errorMessage}`);
    }

    // Replace the request property with the validated and cleaned value
    req[property] = value;
    next();
  };
};

// Individual validation middleware functions
export const validateUserRegistration = validate(userValidation.register);
export const validateUserLogin = validate(userValidation.login);
export const validateUserUpdate = validate(userValidation.updateProfile);
export const validatePasswordChange = validate(userValidation.changePassword);

export const validateProductCreation = validate(productValidation.create);
export const validateProductUpdate = validate(productValidation.update);
export const validateProductQuery = validate(productValidation.query, 'query');

export const validateOrderCreation = validate(orderValidation.create);
export const validateOrderStatusUpdate = validate(orderValidation.updateStatus);

// Parameter validation
export const validateUUIDParam = (paramName: string) => {
  return validate(Joi.object({
    [paramName]: commonSchemas.uuid.required(),
  }), 'params');
};

// Custom validation helpers
export const validateFileUpload = (file: any, allowedTypes: string[], maxSize: number = 5 * 1024 * 1024) => {
  if (!file) {
    throw new ValidationError('File is required');
  }

  if (!allowedTypes.includes(file.mimetype)) {
    throw new ValidationError(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  if (file.size > maxSize) {
    throw new ValidationError(`File size too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
  }
};

export const validateImageUpload = (file: any) => {
  validateFileUpload(file, ['image/jpeg', 'image/png', 'image/webp'], 5 * 1024 * 1024);
};

export const validateDocumentUpload = (file: any) => {
  validateFileUpload(file, ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], 10 * 1024 * 1024);
};

// Array validation helper
export const validateArray = (array: any[], itemSchema: Joi.Schema, options?: { min?: number; max?: number }) => {
  const arraySchema = Joi.array().items(itemSchema);
  
  if (options?.min) {
    arraySchema.min(options.min);
  }
  
  if (options?.max) {
    arraySchema.max(options.max);
  }

  const { error } = arraySchema.validate(array);
  
  if (error) {
    throw new ValidationError(`Array validation failed: ${error.message}`);
  }
};

// Sanitization helpers
export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '');
};

export const sanitizeHtml = (html: string): string => {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

// Rate limiting validation
export const validateRateLimit = (req: Request): boolean => {
  // This would integrate with Redis to check rate limits
  // Implementation depends on your rate limiting strategy
  return true;
};

export default {
  validate,
  userValidation,
  productValidation,
  orderValidation,
  commonSchemas,
  validateUUIDParam,
  validateFileUpload,
  validateImageUpload,
  validateDocumentUpload,
  validateArray,
  sanitizeString,
  sanitizeHtml,
}; 