import express from 'express'
import loginLimiter from '../middleware/loginLimiter.js'
import {
  refresh,
  logout,
  login,
  forgetPassword,
  resestPassword,
} from '../controllers/authController.js'

const router = express.Router()

router.route('/').post(loginLimiter, login)

router.route('/refresh').get(refresh)

router.route('/logout').post(logout)

router.post('/forget-password', loginLimiter, forgetPassword)
router.post('/reset-password/:token', resestPassword)

export default router
