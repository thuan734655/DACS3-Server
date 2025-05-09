import Joi from "joi";

const taskSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
      "string.empty": "Title is required",
      "string.min": "Title must be at least 3 characters long",
      "string.max": "Title must be at most 100 characters long"
    }),
  description: Joi.string()
    .max(500)
    .allow("")
    .messages({
      "string.max": "Description must be at most 500 characters long"
    }),
  status: Joi.string()
    .valid("todo", "in_progress", "completed")
    .default("todo")
    .messages({
      "any.only": "Status must be one of: todo, in_progress, completed"
    }),
  priority: Joi.string()
    .valid("low", "medium", "high")
    .default("medium")
    .messages({
      "any.only": "Priority must be one of: low, medium, high"
    }),
  due_date: Joi.date()
    .min("now")
    .messages({
      "date.min": "Due date must be in the future"
    }),
  assigned_to: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "Invalid user ID format"
    }),
  workspace_id: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.empty": "Workspace ID is required",
      "string.pattern.base": "Invalid workspace ID format"
    })
});

const updateTaskSchema = taskSchema.fork(
  ["title", "description", "status", "priority", "due_date", "assigned_to"],
  (schema) => schema.optional()
).min(1).messages({
  "object.min": "At least one field must be provided for update"
});

export { taskSchema, updateTaskSchema }; 