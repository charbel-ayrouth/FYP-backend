import User from '../models/User.js'
import asyncHandler from 'express-async-handler'
import ROLES from '../config/roles.js'
import Notification from '../models/Notifications.js'
import notificationsType from '../config/notificationsType.js'

// @desc Get recommended supervisors
// @route Get /supervisors/recommended/:userId
// @access Private
const getRecommendedSupervisors = asyncHandler(async (req, res) => {
  const { userId } = req.params

  if (!userId) {
    return res.status(400).json({ message: 'User Id missing' })
  }

  const user = await User.findById(userId)
    // .populate('topics')
    // .populate('domains')
    .lean()
    .exec()

  if (!user) {
    return res.status(400).json({ message: 'User not found' })
  }

  // Build the filter object based on the user's topics and domains
  const filter = {
    role: ROLES.Supervisor,
    username: { $ne: null, $ne: undefined },
    topics: { $in: user.topics },
    domains: { $in: user.domains },
  }

  const users = await User.find(filter)
    .select('-password')
    .populate('topics')
    .populate('domains')
    .lean()
    .exec()

  // if (!users?.length) {
  //   return res.status(400).json({ message: 'No users found' })
  // }

  res.json(users)
})

// @desc Get recommended supervisors
// @route Get /supervisors/other/:userId
// @access Private
const getOtherSupervisors = asyncHandler(async (req, res) => {
  const { userId } = req.params

  if (!userId) {
    return res.status(400).json({ message: 'User Id missing' })
  }

  const user = await User.findById(userId).lean().exec()

  if (!user) {
    return res.status(400).json({ message: 'User not found' })
  }

  const filter = {
    role: ROLES.Supervisor,
    username: { $ne: null, $ne: undefined },
    $or: [
      { topics: { $nin: user.topics } },
      { domains: { $nin: user.domains } },
    ],
  }

  const users = await User.find(filter)
    .select('-password')
    .populate('topics')
    .populate('domains')
    .lean()
    .exec()

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
  getRecommendedSupervisors,
  sendConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  getOtherSupervisors,
}
