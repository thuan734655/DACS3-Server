import Account from "./model_database/accounts.js";
import updateDeviceID from "./updateDeviceID.js";
import updateOTPModel from "./updateOTP.js";
import updateStatusMail from "./updateStatusMail..js";

const verifyOTPModel = async (email, otp, deviceID) => {
  const account = await Account.findOne({ email: { $eq: email } });
  if (!account) {
    throw new Error("Email not found");
  }
  // check thoi gian co hieu luc otp
  const isEffectiveOTP = account.create_at_otp > Date.now() - 10 * 60 * 1000;
  if (!isEffectiveOTP) {
    return { isEffectiveOTP };
  }
  // check match otp
  const isMatchOTP = account.otp === otp;
  if (!isMatchOTP) {
    return { isEffectiveOTP, isMatchOTP };
  }

  updateOTPModel(email, null, null);

  updateStatusMail(email, true); // set verifyMail => true

  updateDeviceID(email, deviceID); // set deviceID => 2fa

  return { isMatchOTP, isEffectiveOTP };
};

export default verifyOTPModel;
