import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authroutes from "./routes/auth.js";
import otpRoutes from "./routes/otp.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/auth", authroutes);
app.use("/api/otp", otpRoutes); 

app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on all interfaces");
});
