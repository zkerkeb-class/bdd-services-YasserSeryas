import express from "express";
import { getUserByEmail, createUser } from "../controllers/authController.js";

const router = express.Router();

router.get("/users/:email", getUserByEmail);
router.post("/users", createUser);

export default router;
