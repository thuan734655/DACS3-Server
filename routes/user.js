import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import authenticateToken from "../middlewares/authenticateToken.js";
import upload from "../middlewares/multerConfig.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/", getAllUsers);

router.get("/:id", getUserById);

router.post("/", createUser);

router.put('/:id', upload.single('avatar'), updateUser);

router.delete("/:id", deleteUser);

export default router; 