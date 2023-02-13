import User from "../models/User.js"
import asyncHandler from "express-async-handler"
import bcrypt from "bcrypt"

// @desc Get all users
// @route Get /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").lean()

  if (!users?.length) {
    return res.status(400).json({ mesage: "No users found" })
  }
  res.json(users)
})

// @desc Create new user
// @route Post /users
// @access Private
const createNewUser = asyncHandler(async (req, res) => {
  const { username, password, role } = req.body
  // confirm data
  if (!username || !password || !role) {
    return res.status(400).json({ message: "All fields are required" })
  }

  //check for duplicate (called exec because we are passing username in)
  const duplicate = await User.findOne({ username }).lean().exec()
  if (duplicate) {
    res.status(409).json({ message: "Duplicate username" })
  }

  //Hash password
  const hashedPwd = await bcrypt.hash(password, 10) // 10 salt rounds

  const userObject = { username, password: hashedPwd, role }

  //Create ans store new user
  const user = await User.create(userObject)

  if (user) {
    // if it was created
    res.status(201).json({ message: `New user ${username} created` })
  } else {
    res.status(400).json({ message: "Invalid user data received" })
  }
})

// @desc Update a user
// @route Patch /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
  const { id, username, role, active, password } = req.body

  // Confirm data
  if (!id || !username || !role || typeof active !== "boolean") {
    return res.status(400).json({ message: "All fields are required" })
  }

  // we didnt call .lean() because we need save function attached to it
  const user = await User.findById(id).exec()

  if (!user) {
    return res.status(400).json({ message: "User not found" })
  }

  // Check for duplicate
  const duplicate = await User.findOne({ username }).lean().exec()
  // Allow updates to the original user
  if (duplicate && duplicate?._id.toString() !== id) {
    // trying to update to a username that already exist
    return res.status(409).json({ message: "Duplicate username" })
  }

  user.username = username
  user.role = role
  user.active = active

  if (password) {
    // hash password
    user.password = await bcrypt.hash(password, 10)
  }

  const updatedUser = await user.save()

  res.json({ message: `${updatedUser.username} updated` })
})

// @desc Delete a user
// @route Delete /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.body

  if (!id) {
    return res.status(400).json({ message: "User ID Required" })
  }

  const user = await User.findById(id).exec()

  if (!user) {
    return res.status(400).json({ message: "User not found" })
  }

  const result = await user.deleteOne()

  const reply = `Username ${result.username} with ID ${result._id} deleted`

  res.json(reply)
})

export { getAllUsers, createNewUser, updateUser, deleteUser }
