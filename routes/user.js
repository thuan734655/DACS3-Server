import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import authenticateToken from "../middlewares/authenticateToken.js";

const router = express.Router();

// Apply verifyToken middleware to all routes
router.use(authenticateToken);

// GET all users with pagination
router.get("/", getAllUsers);

// GET user by ID
router.get("/:id", getUserById);

// POST create new user
router.post("/", createUser);

// PUT update user
router.put("/:id", updateUser);

// DELETE user
router.delete("/:id", deleteUser);

export default router; 