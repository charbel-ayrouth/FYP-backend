import User from '../models/User.js'
import asyncHandler from 'express-async-handler'
import bcrypt from 'bcrypt'

// @desc Update profile
// @route PATCH /profile
// @access Private
const updateProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const { username, password } = req.body

  // Confirm data
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: 'username and password are required' })
  }

  // Does the user exist to update?
  const user = await User.findById(userId).exec()

  if (!user) {
    return res.status(400).json({ message: 'User not found' })
  }

  // Check for duplicate
  const duplicate = await User.findOne({ username })
    .collation({ locale: 'en', strength: 2 })
    .lean()
    .exec()

  // Allow updates to the original user
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: 'Duplicate username' })
  }

  user.username = username

  if (password) {
    // Hash password
    user.password = await bcrypt.hash(password, 10) // salt rounds
  }

  const updatedUser = await user.save()

  res.json({ message: `${updatedUser.username} updated` })
})

export { updateProfile }
