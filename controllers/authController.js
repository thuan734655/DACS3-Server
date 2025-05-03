import { registerModel, loginModel } from "../models/authModel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const registerController = async (req, res) => {
  const { username, email, contactNumber, password } = req.body;
  console.log(username, email, contactNumber, password);
  try {
    const newAccount = await registerModel(
      username,
      email,
      contactNumber,
      password
    );
    res.status(201).json({
      message: "Account created successfully",
      account: {
        username: newAccount.username,
        email: newAccount.email,
        contactNumber: newAccount.contactNumber,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const loginController = async (req, res) => {
  const { accountName, password, type } = req.body;
  try {
    const account = await loginModel(accountName, password, type);
    if (!account) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    const token = jwt.sign(
      { id: account._id, username: account.username, email: account.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({
      message: "Login successful",
      token,
      account: {
        username: account.username,
        email: account.email,
        contactNumber: account.contactNumber,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export { registerController, loginController };
