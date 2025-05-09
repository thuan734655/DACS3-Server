import mongoose from "mongoose";
import connectDB from "../../config/connectDB.js";

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
  otp: {
    type: String,
    required: false,
  },
  create_at_otp: {
    type: Date,
    required: false,
  },
  verifyMail: {
    type: Boolean,
    default: false,
  },
  deviceID: {
    type: String,
    required: false,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }
});

const Account = mongoose.model("Account", accountSchema);

export default Account;
