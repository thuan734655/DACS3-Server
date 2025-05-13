import Joi from 'joi';
import mongoose from 'mongoose';

const validateObjectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

const notificationTypes = ['mention', 'task', 'reminder', 'report'];

export const createNotificationSchema = Joi.object({
  user_id: Joi.string().custom(validateObjectId).required().messages({
    'any.required': 'User ID is required',
    'string.empty': 'User ID cannot be empty',
    'any.invalid': 'User ID must be a valid ObjectId'
  }),
  type: Joi.string().valid(...notificationTypes).required().messages({
    'any.required': 'Notification type is required',
    'string.empty': 'Notification type cannot be empty',
    'any.only': `Notification type must be one of: ${notificationTypes.join(', ')}`
  }),
  workspace_id: Joi.string().custom(validateObjectId).required().messages({
    'any.required': 'Workspace ID is required',
    'string.empty': 'Workspace ID cannot be empty',
    'any.invalid': 'Workspace ID must be a valid ObjectId'
  }),
  content: Joi.string().required().messages({
    'any.required': 'Content is required',
    'string.empty': 'Content cannot be empty'
  }),
  related_id: Joi.string().custom(validateObjectId).allow(null).messages({
    'any.invalid': 'Related ID must be a valid ObjectId'
  }),
  is_read: Joi.boolean().default(false)
});

export const updateNotificationSchema = Joi.object({
  is_read: Joi.boolean().required().messages({
    'any.required': 'Read status is required',
    'boolean.base': 'Read status must be a boolean'
  })
});

export const validateNotificationId = Joi.object({
  id: Joi.string().custom(validateObjectId).required().messages({
    'any.required': 'Notification ID is required',
    'string.empty': 'Notification ID cannot be empty',
    'any.invalid': 'Notification ID must be a valid ObjectId'
  })
});

export const validateWorkspaceId = Joi.object({
  workspaceId: Joi.string().custom(validateObjectId).required().messages({
    'any.required': 'Workspace ID is required',
    'string.empty': 'Workspace ID cannot be empty',
    'any.invalid': 'Workspace ID must be a valid ObjectId'
  })
});

export const validateUserId = Joi.object({
  userId: Joi.string().custom(validateObjectId).required().messages({
    'any.required': 'User ID is required',
    'string.empty': 'User ID cannot be empty',
    'any.invalid': 'User ID must be a valid ObjectId'
  })
}); 