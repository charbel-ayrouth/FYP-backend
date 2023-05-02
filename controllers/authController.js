import * as dotenv from 'dotenv'
dotenv.config()
import User from '../models/User.js'
import asyncHandler from 'express-async-handler'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import Token from '../models/Token.js'
import { transporter } from '../server.js'

// @desc Login
// @route Post /auth
// @access Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required' })
  }

  const foundUser = await User.findOne({ email }).exec()

  if (!foundUser || !foundUser.active) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const match = await bcrypt.compare(password, foundUser.password)

  if (!match) return res.status(401).json({ message: 'Unauthorized' })

  const accessToken = jwt.sign(
    {
      UserInfo: {
        email: foundUser.email,
        role: foundUser.role,
        id: foundUser._id,
        username: foundUser.username,
        setupComplete: foundUser.setupComplete,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  )

  const refreshToken = jwt.sign(
    { email: foundUser.email },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  )

  // Create secure cookie with refresh token
  res.cookie('jwt', refreshToken, {
    httpOnly: true, //accessible only by web server
    secure: true, //https
    sameSite: 'None', //cross-site cookie
    maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
  })

  // Send accessToken containing username and role
  res.json({ accessToken })
})

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because token has expired
const refresh = (req, res) => {
  const cookies = req.cookies

  if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized' })

  const refreshToken = cookies.jwt

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    asyncHandler(async (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Forbidden' })

      const foundUser = await User.findOne({
        email: decoded.email,
      }).exec()

      if (!foundUser) return res.status(401).json({ message: 'Unauthorized' })

      const accessToken = jwt.sign(
        {
          UserInfo: {
            email: foundUser.email,
            role: foundUser.role,
            id: foundUser._id,
            username: foundUser.username,
            setupComplete: foundUser.setupComplete,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
      )

      res.json({ accessToken })
    })
  )
}

// @desc Logout
// @route Post /auth/logout
// @access Public - just to clear cookie if exists
const logout = (req, res) => {
  const cookies = req.cookies
  if (!cookies?.jwt) return res.sendStatus(204) //No content
  res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true })
  res.json({ message: 'Cookie cleared' })
}

// @desc create Token and send email
// @route Post /auth/forget-password
// @access Public
const forgetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body

  // Check if the user with the email address exists in your database
  const user = await User.findOne({ email })
  if (!user) {
    return res
      .status(400)
      .json({ message: 'User with this email does not exist' })
  }

  const token = crypto.randomBytes(20).toString('hex')

  const existingToken = await Token.findOne({ userId: user._id })

  if (existingToken) {
    // Update the existing token document
    existingToken.token = token
    existingToken.createdAt = Date.now()
    await existingToken.save()
  } else {
    // Create a new token document
    const resetToken = new Token({
      userId: user._id,
      token: token,
    })
    await resetToken.save()
  }

  const mailOptions = {
    to: email,
    from: process.env.MAIL_USERNAME,
    subject: 'Reset your password',
    text: `You are receiving this email because you (or someone else) have requested to reset the password for your account.\n\n
      Please click on the following link or paste it into your browser to complete the process:\n\n
      http://localhost:3000/reset-password/${token}\n\n
      If you did not request this, please ignore this email and your password will remain unchanged.\n`,
  }

  transporter.sendMail(mailOptions, function (err, data) {
    if (err) {
      console.log('Error ' + err)
      res.status(400).json({ message: 'Error sending the email' })
    } else {
      console.log('Email sent successfully')
      res.status(200).json({ message: 'Email sent to reset password' })
    }
  })
})

// @desc create Token and send email
// @route Post /auth/forget-password
// @access Public
const resestPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body
  const { token } = req.params

  // Find the reset password token in your database
  const resetToken = await Token.findOne({ token }).lean()

  // Check if the reset password token exists and is not expired
  if (!resetToken) {
    return res
      .status(400)
      .json({ message: 'Invalid or expired reset password token' })
  }

  // Find the user with the user ID stored in the reset password token
  const user = await User.findById(resetToken.userId)

  if (!user) {
    return res
      .status(400)
      .json({ message: 'User with the provided token not found' })
  }

  const match = await bcrypt.compare(newPassword, user.password)

  if (match) {
    return res
      .status(400)
      .json({ message: 'Cannot change password to old password' })
  }

  // Update the user's password in your database using bcrypt
  user.password = await bcrypt.hash(newPassword, 10)
  await user.save()

  // Delete the reset password token from your database
  await Token.findByIdAndDelete(resetToken._id)

  res.status(200).json({ message: 'Password reset successful' })
})

export { login, refresh, logout, forgetPassword, resestPassword }
