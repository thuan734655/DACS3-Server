import { registerModel, loginModel } from "../models/authModel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import sendOTP from "../helper/otp/sendOTP.js";

dotenv.config();

const registerController = async (req, res) => {
  const { username, email, contactNumber, password } = req.body;
  try {
    const newAccount = await registerModel(
      username,
      email,
      contactNumber,
      password
    );

    //send otp
    const verifyMail = false;
    sendOTP(email, verifyMail);

    res.status(201).json({
      message: "Account created successfully",
      success: true,
      account: {
        username: newAccount.username,
        email: newAccount.email,
        contactNumber: newAccount.contactNumber,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// accountName boi vi dang nhap co the su dung email hoac so dien thoai
// type E la email, S la so dien thoai
// email phai lay tu loginModel boi vi client gui len khong chac chan do la email. loginModel tra ve dung email cua account dang dang nhap.
const loginController = async (req, res) => {
  const { accountName, password, type, deviceID } = req.body;
  console.log("accountName", accountName);
  try {
    const { account, verifyMail, email, user } = await loginModel(
      accountName,
      password,
      type,
      deviceID
    );
    if (!account) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    console.log("verifyMail", user);

    if (!verifyMail) {
      //send otp
      const verifyMail = false;
      await sendOTP(email, verifyMail);

      return res.status(401).json({
        message: "Please verify your email before logging in",
        action: "verify_email",
        email: email,
      });
    }
    // if (!isMatchDeviceID) {
    //   return res.status(401).json({
    //     message: "Invalid device ID",
    //     action: "2fa",
    //     data: { email: email },
    //   });
    // }
    const token = jwt.sign(
      { id: user._id, username: user.name, email: account.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({
      message: "Login successful",
      token,
      success: true,
      account: {
        username: account.username,
        email: account.email,
        contactNumber: account.contactNumber,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export { registerController, loginController };
