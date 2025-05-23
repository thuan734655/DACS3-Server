import Joi from "joi";
import mongoose from "mongoose";

const objectIdSchema = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid ID format");
  }
  return value;
});

const createTaskSchema = Joi.object({
  workspace_id: objectIdSchema.required().messages({
    "any.required": "Workspace ID is required",
    "string.empty": "Workspace ID cannot be empty",
  }),
  title: Joi.string().required().min(3).max(100).messages({
    "any.required": "Title is required",
    "string.empty": "Title cannot be empty",
    "string.min": "Title must be at least 3 characters long",
    "string.max": "Title must be at most 100 characters long",
  }),
  description: Joi.string().allow("").max(500).messages({
    "string.max": "Description must be at most 500 characters long",
  }),
  assigned_to: Joi.array().items(objectIdSchema).messages({
    "array.base": "Assigned to must be an array of user IDs",
  }),
  due_date: Joi.date().allow(null).messages({
    "date.base": "Due date must be a valid date",
  }),
  start_date: Joi.date().allow(null).messages({
    "date.base": "Start date must be a valid date",
  }),
  status: Joi.string().valid("To Do", "In Progress", "Done").messages({
    "any.only": "Status must be one of: To Do, In Progress, Done",
  }),
  progress: Joi.number().min(0).max(100).messages({
    "number.base": "Progress must be a number",
    "number.min": "Progress must be at least 0",
    "number.max": "Progress must be at most 100",
  }),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().min(3).max(100).messages({
    "string.empty": "Title cannot be empty",
    "string.min": "Title must be at least 3 characters long",
    "string.max": "Title must be at most 100 characters long",
  }),
  description: Joi.string().allow("").max(500).messages({
    "string.max": "Description must be at most 500 characters long",
  }),
  assigned_to: Joi.array().items(objectIdSchema).messages({
    "array.base": "Assigned to must be an array of user IDs",
  }),
  due_date: Joi.date().allow(null).messages({
    "date.base": "Due date must be a valid date",
  }),
  start_date: Joi.date().allow(null).messages({
    "date.base": "Start date must be a valid date",
  }),
  status: Joi.string().valid("To Do", "In Progress", "Done").messages({
    "any.only": "Status must be one of: To Do, In Progress, Done",
  }),
  progress: Joi.number().min(0).max(100).messages({
    "number.base": "Progress must be a number",
    "number.min": "Progress must be at least 0",
    "number.max": "Progress must be at most 100",
  }),
});

export { createTaskSchema, updateTaskSchema }; 