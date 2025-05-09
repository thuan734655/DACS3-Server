import { Router } from "express";

const router = Router();

router.post("/", (req, res) => {
  console.log("Home route accessed");
  res.status(200).json({
    message: "Welcome to the API",
    action: "home",
    data: {},
  });
});

export default router;
