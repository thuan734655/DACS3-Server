import Account from "./model_database/accounts.js";

const updateDeviceID = async (email, deviceID) => {
  const updateDeviceIDStatus = await Account.findOneAndUpdate(
    { email: { $eq: email } },
    { deviceID: deviceID },
    { new: true, runValidators: true }
  );
  if (!updateDeviceIDStatus) {
    throw new Error("Failed to update device ID");
  }
};

export default updateDeviceID;
