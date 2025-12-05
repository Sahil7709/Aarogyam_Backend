import { validationResult, body, query, param } from 'express-validator';
import ErrorResponse from '../utils/errorResponse.js';

// Validation result handler
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    return next(new ErrorResponse(`Validation failed: ${errorMessages.join(', ')}`, 400));
  }
  next();
};

// User registration validation
export const validateRegistration = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]{10,}$/)
    .withMessage('Please provide a valid phone number'),
  
  // At least one of email or phone must be provided
  body()
    .custom((value, { req }) => {
      if (!req.body.email && !req.body.phone) {
        throw new Error('Either email or phone number is required');
      }
      return true;
    }),
];

// Appointment validation
export const validateAppointment = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  
  body('phone')
    .notEmpty()
    .withMessage('Phone is required')
    .matches(/^\+?[\d\s\-\(\)]{10,}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Please provide a valid date')
    .custom((value) => {
      const dateObj = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dateObj < today) {
        throw new Error('Appointment date cannot be in the past');
      }
      return true;
    }),
  
  body('time')
    .notEmpty()
    .withMessage('Time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid time in HH:mm format'),
];

// Medical report validation
export const validateMedicalReport = [
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['blood-test', 'gut-test'])
    .withMessage('Invalid category'),
  
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Please provide a valid date'),
];

// Contact message validation
export const validateContactMessage = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  body('subject')
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 3 })
    .withMessage('Subject must be at least 3 characters long'),
  
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10 })
    .withMessage('Message must be at least 10 characters long'),
];

// ID parameter validation
export const validateIdParam = [
  param('id')
    .notEmpty()
    .withMessage('ID parameter is required')
    .isMongoId()
    .withMessage('Please provide a valid ID'),
];