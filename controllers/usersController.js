import User from '../models/User.js'
import asyncHandler from 'express-async-handler'
import bcrypt from 'bcrypt'
import ROLES from '../config/roles.js'
import Notification from '../models/Notifications.js'
import notificationsType from '../config/notificationsType.js'
import DomainOfApplication from '../models/DomainOfApplication.js'
import TopicOfInterest from '../models/TopicOfInterest.js'

// @desc Get all users
// @route Get /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: { $ne: ROLES.Admin } })
    .select('-password')
    .lean()

  // if (!users?.length) {
  //   return res.status(400).json({ message: 'No users found' })
  // }
  res.json(users)
})

// @desc check if user has completed account setup
// @route POST /users/:id
// @access Private
const accountSetupComplete = asyncHandler(async (req, res) => {
  const { id } = req.params

  const user = await User.findById(id).exec()

  if (!user) {
    return res.status(400).json({ message: 'User not found' })
  }

  user.setupComplete = true
  const updatedUser = await user.save()

  res.status(201).json({
    message: `${updatedUser.username} has completed his account setup`,
  })
})

// @desc get overview for dashboard
// @route Get /users/:id
// @access Private
const overview = asyncHandler(async (req, res) => {
  const { id } = req.params

  const user = await User.findById(id).exec()

  if (!user) {
    return res.status(400).json({ message: 'User not found' })
  } else if (user.role === ROLES.Admin) {
    const userCount = await User.countDocuments({
      $or: [{ role: ROLES.Student }, { role: ROLES.Supervisor }],
    })
    const domainCount = await DomainOfApplication.countDocuments()
    const topicCount = await TopicOfInterest.countDocuments()
    return res.status(200).json({
      userCount,
      domainCount,
      topicCount,
    })
  } else if (user.role === ROLES.Student || user.role === ROLES.Supervisor) {
    const selectedDomain = user.domains.length
    const selectedTopic = user.topics.length
    const connections = user.connections.length
    return res.status(200).json({
      selectedDomain,
      selectedTopic,
      connections,
    })
  }
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
    if (user.role === ROLES.Supervisor) {
      // Send notifications to all the students and supervisors
      const users = await User.find({
        role: ROLES.Student,
      })
        .lean()
        .exec()

      // Loop through users and send notifications
      users.forEach(async (u) => {
        // Check if a notification of type "domain" already exists for the user
        const existingNotifications = await Notification.find({
          user: u._id,
          type: notificationsType.newSupervisor,
          read: false,
        })
          .lean()
          .exec()
        const notificationExists = existingNotifications.length > 0

        // If a notification already exists, update the message
        if (notificationExists) {
          const existingNotification = existingNotifications[0]
          const message = `Multiple Supervisors have been added`
          await Notification.findByIdAndUpdate(existingNotification._id, {
            message,
          }).exec()
        }
        // If a notification doesn't exist, create a new notification
        else {
          const message = `New Supervisor ${user.username} has been added`
          await Notification.create({
            user: u._id,
            message,
            type: notificationsType.newSupervisor,
          })
        }
      })
    }
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

export {
  getAllUsers,
  createNewUser,
  adminUpdateUser,
  deleteUser,
  accountSetupComplete,
  overview,
}
