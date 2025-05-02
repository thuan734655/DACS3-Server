import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "../config/connectDB.js";

connectDB();

const accountSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  contactNumber: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
});

const Account = mongoose.model("Account", accountSchema);

const registerModel = async (username, email, contactNumber, password) => {
  const ExistingAccount = await Account.findOne({
    username: { $eq: username },
  });

  if (ExistingAccount) {
    throw new Error("Username already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newAccount = new Account({
    username,
    password: hashedPassword,
    email,
    contactNumber,
  });

  await newAccount.save();
  return newAccount;
};

const loginModel = async (accountName, password, type) => {
  const query =
    type === "E"
      ? { email: { $eq: accountName } }
      : { contactNumber: { $eq: accountName } };
  const account = await Account.findOne(query);
  if (!account) {
    throw new Error("Invalid username or password");
  }

  const isMatchPassword = await bcrypt.compare(password, account.password);
  console.log(isMatchPassword);
  if (!isMatchPassword) {
    throw new Error("Invali password");
  }
  return account;
};

export { registerModel, loginModel };
