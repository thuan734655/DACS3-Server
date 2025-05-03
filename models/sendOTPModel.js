import sendMail from "../utils/mail/sendMail.js";
import Account from "./model_database/accounts.js";

const sendOTPModel = async (email, otp, create_at_otp) => {
  const updateOTP = await Account.findOneAndUpdate(
    { email },
    { otp, create_at_otp },
    { new: true, runValidators: true }
  );
  if (!updateOTP) {
    throw new Error("Email not found");
  }
  await sendMail(
    email,
    "OTP for Account Verification",
    `Your OTP is ${otp}`,
    `<h1>Your OTP is ${otp}</h1>`
  );
};

export default sendOTPModel;
