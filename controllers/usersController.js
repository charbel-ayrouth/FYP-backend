import User from '../models/User.js'
import asyncHandler from 'express-async-handler'
import bcrypt from 'bcrypt'

// @desc Get all users
// @route Get /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').lean()

  if (!users?.length) {
    return res.status(400).json({ mesage: 'No users found' })
  }
  res.json(users)
})

// @desc Create new user
// @route Post /users
// @access Private
const createNewUser = asyncHandler(async (req, res) => {
  const { username, email, password = '123456', role } = req.body
  // confirm data
  if (!email || !role) {
    return res.status(400).json({ message: 'All fields are required' })
  }

  if (username) {
    //check for duplicate (called exec because we are passing username in) ,
    const duplicateUsername = await User.findOne({ username })
      .collation({ locale: 'en', strength: 2 }) // collation used to check for lowercase and uppercase letter
      .lean()
      .exec()
    if (duplicateUsername) {
      return res.status(409).json({ message: 'Duplicate username' })
    }
  }

  const duplicateEmail = await User.findOne({ email })
    .collation({ locale: 'en', strength: 2 })
    .lean()
    .exec()
  if (duplicateEmail) {
    return res.status(409).json({ message: 'Duplicate email' })
  }

  //Hash password
  const hashedPwd = await bcrypt.hash(password, 10) // 10 salt rounds

  const userObject = { username, email, password: hashedPwd, role }

  //Create ans store new user
  const user = await User.create(userObject)

  if (user) {
    // if it was created
    res.status(201).json({ message: `New user ${email} created` })
  } else {
    res.status(400).json({ message: 'Invalid user data received' })
  }
})

// @desc admin update user (email , role and active)
// @route Patch /users
// @access Private
const adminUpdateUser = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { email, role, active } = req.body

  // Confirm data
  if (!id || !email || !role || typeof active !== 'boolean') {
    return res.status(400).json({ message: 'All fields are required' })
  }

  // we didnt call .lean() because we need save function attached to it
  const user = await User.findById(id).exec()

  if (!user) {
    return res.status(400).json({ message: 'User not found' })
  }

  const duplicateEmail = await User.findOne({ email })
    .collation({ locale: 'en', strength: 2 })
    .lean()
    .exec()
  if (duplicateEmail && duplicateEmail?._id.toString() !== id) {
    return res.status(409).json({ message: 'Duplicate email' })
  }

  user.email = email
  user.role = role
  user.active = active

  const updatedUser = await user.save()

  res.json({ message: `${updatedUser.email} updated` })
})

// @desc Delete a user
// @route Delete /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params

  if (!id) {
    return res.status(400).json({ message: 'User ID Required' })
  }

  const user = await User.findById(id).exec()

  if (!user) {
    return res.status(400).json({ message: 'User not found' })
  }

  const result = await user.deleteOne()

  const reply = `Username ${result.username} with ID ${result._id} deleted`

  res.json(reply)
})

export { getAllUsers, createNewUser, adminUpdateUser, deleteUser }
