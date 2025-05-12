import Account from "./model_database/accounts.js";

const updateOTPModel = async (email, otp, create_at_otp) => {
  const updateOTP = await Account.findOneAndUpdate(
    { email },
    { otp, create_at_otp },
    { new: true, runValidators: true }
  );

  if (!updateOTP) {
    throw new Error("Email not found");
  }
};

export default updateOTPModel;
