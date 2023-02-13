import express from "express"
import loginLimiter from "../middleware/loginLimiter.js"
import { refresh, logout, login } from "../controllers/authController.js"

const router = express.Router()

router.route("/").post(loginLimiter, login)

router.route("/refresh").get(refresh)

router.route("/logout").post(logout)

export default router
