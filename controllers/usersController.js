import User from '../models/User.js'
import asyncHandler from 'express-async-handler'
import bcrypt from 'bcrypt'
import ROLES from '../config/roles.js'
import Notification from '../models/Notifications.js'
import notificationsType from '../config/notificationsType.js'

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

// @desc check if user has completed account setup
// @route Patch /users/:id
// @access Private
const accountSetupComplete = asyncHandler(async (req, res) => {
  const { id } = req.params

  const user = await User.findById(id)
    .populate('topics')
    .populate('domains')
    .lean()
    .exec()

  if (!user.username || user.topics.length === 0 || user.domains.length === 0) {
    return res
      .status(400)
      .json({ message: 'Please complete your account setup' })
  } else {
    return res
      .status(201)
      .json({ message: `${user.username} has completed his account setup` })
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

// @desc Get all users
// @route Get /users/supervisors
// @access Private
const getAllSupervisors = asyncHandler(async (req, res) => {
  // Get filter parameters from req.query
  const { topicIds, domainIds } = req.query

  // Build the filter object
  const filter = {
    role: ROLES.Supervisor,
    username: { $ne: null, $ne: undefined },
  }

  if (topicIds) {
    // Convert comma-separated string of topic IDs to array of ObjectIds
    const topicObjectIds = topicIds
      .split(',')
      .map((id) => mongoose.Types.ObjectId(id))
    filter.topics = { $in: topicObjectIds }
  }

  if (domainIds) {
    // Convert comma-separated string of domain IDs to array of ObjectIds
    const domainObjectIds = domainIds
      .split(',')
      .map((id) => mongoose.Types.ObjectId(id))
    filter.domains = { $in: domainObjectIds }
  }

  const users = await User.find(filter)
    .select('-password')
    .populate('topics')
    .populate('domains')
    .lean()
    .exec()

  if (!users?.length) {
    return res.status(400).json({ mesage: 'No users found' })
  }
  res.json(users)
})

// @desc    Send connection request to supervisor
// @route   POST /users/:supervisorId/connect
// @access  Private (student only)
const sendConnectionRequest = asyncHandler(async (req, res) => {
  const { supervisorId } = req.params
  const { studentId } = req.body // user ID of the student sending the request

  // Check if the supervisor exists
  const supervisor = await User.findById(supervisorId)
  const student = await User.findById(studentId)

  if (!supervisor || supervisor.role !== ROLES.Supervisor) {
    res.status(400).json({ message: 'Supervisor not found' })
  }
  if (!student || student.role !== ROLES.Student) {
    res.status(400).json({ message: 'Student not found' })
  }

  // Add the student's ID to the supervisor's connection requests array
  supervisor.connectionRequest.push(studentId)
  await supervisor.save()

  await Notification.create({
    user: supervisorId,
    message: `${student.username} has sent you a connection request`,
    type: notificationsType.connRequest,
  })

  res.status(200).json({ message: 'Connection request sent successfully' })
})

// @desc    Send connection request to supervisor
// @route   POST /users/:supervisorId/accept
// @access  Private (student only)
const acceptConnectionRequest = asyncHandler(async (req, res) => {
  const { supervisorId } = req.params
  const { studentId } = req.body

  // Find the student and supervisor in the database
  const student = await User.findById(studentId)
  const supervisor = await User.findById(supervisorId)

  if (!supervisor || supervisor.role !== ROLES.Supervisor) {
    res.status(400).json({ message: 'Supervisor not found' })
  }
  if (!student || student.role !== ROLES.Student) {
    res.status(400).json({ message: 'Student not found' })
  }

  // Update the connection lists of the student and the supervisor
  student.connections.push(supervisorId)
  await student.save()

  supervisor.connections.push(studentId)
  await supervisor.save()

  // Remove the student's ID from the supervisor's connection request list
  supervisor.connectionRequest = supervisor.connectionRequest.filter(
    (id) => id.toString() !== studentId.toString()
  )
  await supervisor.save()

  await Notification.create({
    user: studentId,
    message: `${supervisor.username} accepted your connection request`,
    type: notificationsType.connAccept,
  })

  res.status(200).json({ message: 'Connection request accepted.' })
})

const declineConnectionRequest = asyncHandler(async (req, res) => {
  const { supervisorId } = req.params
  const { studentId } = req.body

  // Find the student and supervisor in the database
  const student = await User.findById(studentId)
  const supervisor = await User.findById(supervisorId)

  if (!supervisor || supervisor.role !== ROLES.Supervisor) {
    res.status(400).json({ message: 'Supervisor not found' })
  }
  if (!student || student.role !== ROLES.Student) {
    res.status(400).json({ message: 'Student not found' })
  }

  // Check if the supervisor has a connection request from the student
  if (!supervisor.connectionRequest.includes(studentId)) {
    return res.status(404).json({ message: 'Connection request not found' })
  }

  // Remove the connection request from the user's connectionRequest array
  const index = supervisor.connectionRequest.indexOf(studentId)
  supervisor.connectionRequest.splice(index, 1)
  await supervisor.save()

  await Notification.create({
    user: studentId,
    message: `${supervisor.username} declined your connection request`,
    type: notificationsType.connDecline,
  })

  return res.status(200).json({ message: 'Connection request declined' })
})

export {
  getAllUsers,
  createNewUser,
  adminUpdateUser,
  deleteUser,
  getAllSupervisors,
  sendConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  accountSetupComplete,
}
