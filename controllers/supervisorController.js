import User from '../models/User.js'
import asyncHandler from 'express-async-handler'
import ROLES from '../config/roles.js'
import Notification from '../models/Notifications.js'
import notificationsType from '../config/notificationsType.js'
import { transporter } from '../server.js'

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
// @route   POST /supervisors/:supervisorId/connect
// @access  Private (student only)
const sendConnectionRequest = asyncHandler(async (req, res) => {
  const { supervisorId } = req.params
  const { studentId, message } = req.body // user ID of the student sending the request

  // Check if the supervisor exists
  const supervisor = await User.findById(supervisorId)
  const student = await User.findById(studentId)

  if (!supervisor || supervisor.role !== ROLES.Supervisor) {
    return res.status(400).json({ message: 'Supervisor not found' })
  }
  if (!student || student.role !== ROLES.Student) {
    return res.status(400).json({ message: 'Student not found' })
  }

  // Check if the student has already sent a connection request to the supervisor
  const existingConnectionRequest = supervisor.connectionRequest.find(
    (request) => request.user.toString() === studentId
  )
  if (existingConnectionRequest) {
    return res.status(400).json({
      message: 'You have already sent a connection request to this supervisor',
    })
  }
  // Check if the supervisor has already connected with the student
  const existingConnection = supervisor.connections.find(
    (conn) => conn.toString() === studentId
  )
  if (existingConnection) {
    return res.status(400).json({
      message: 'You have already been connected',
    })
  }

  const connectionRequest = {
    user: studentId,
    message: message,
  }

  // Add the student's ID to the supervisor's connection requests array
  supervisor.connectionRequest.push(connectionRequest)
  await supervisor.save()

  const mailOptions = {
    to: supervisor.email,
    from: process.env.MAIL_USERNAME,
    subject: 'Connection Request Received',
    text: `${student.username} has sent you a connection request`,
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

  await Notification.create({
    user: supervisorId,
    message: `${student.username} has sent you a connection request`,
    type: notificationsType.connRequest,
  })

  return res
    .status(200)
    .json({ message: 'Connection request sent successfully' })
})

// @desc    Accept connection request to supervisor
// @route   POST /supervisors/:supervisorId/accept
// @access  Private (student only)
const acceptConnectionRequest = asyncHandler(async (req, res) => {
  const { supervisorId } = req.params
  const { studentId } = req.body

  // Find the student and supervisor in the database
  const student = await User.findById(studentId)
  const supervisor = await User.findById(supervisorId)

  if (!supervisor || supervisor.role !== ROLES.Supervisor) {
    return res.status(400).json({ message: 'Supervisor not found' })
  }
  if (!student || student.role !== ROLES.Student) {
    return res.status(400).json({ message: 'Student not found' })
  }

  if (
    !supervisor.connectionRequest.some(
      (req) => req.user.toString() === studentId
    )
  ) {
    res.status(404).json({ message: 'Connection request not found' })
  }
  // Update the connection lists of the student and the supervisor
  student.connections.push(supervisorId)
  await student.save()

  supervisor.connections.push(studentId)
  await supervisor.save()

  const newConnectionRequest = supervisor.connectionRequest.filter(
    (request) => request.user.toString() !== studentId
  )

  // Remove the student's ID from the supervisor's connection request list
  supervisor.connectionRequest = newConnectionRequest

  await supervisor.save()

  const mailOptions = {
    to: student.email,
    from: process.env.MAIL_USERNAME,
    subject: 'Connection Request Accepted',
    text: `${supervisor.username} has accept your connection request`,
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
  if (
    !supervisor.connectionRequest.some(
      (request) => request.user.toString() === studentId
    )
  ) {
    res.status(404).json({ message: 'Connection request not found' })
  }

  const newConnectionRequest = supervisor.connectionRequest.filter(
    (request) => request.user.toString() !== studentId
  )

  supervisor.connectionRequest = newConnectionRequest
  await supervisor.save()

  const mailOptions = {
    to: student.email,
    from: process.env.MAIL_USERNAME,
    subject: 'Connection Request Declined',
    text: `${supervisor.username} has declined your connection request`,
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

  await Notification.create({
    user: studentId,
    message: `${supervisor.username} declined your connection request`,
    type: notificationsType.connDecline,
  })

  return res.status(200).json({ message: 'Connection request declined' })
})

// @desc    get connection request of student and user
// @route   Get
// @access  Private
const getConnectionsRequest = asyncHandler(async (req, res) => {
  const { supervisorId } = req.params

  // Check if the user exists
  const user = await User.findById(supervisorId).lean()

  if (!user) {
    res.status(400).json({ message: 'User not found' })
    return
  }

  const connectionRequests = user.connectionRequest.map((request) => {
    return {
      user: request.user,
      message: request.message,
    }
  })

  // Find all the users in the `connectionRequest` array and populate their information
  const connectionRequestUsers = await User.find({
    _id: { $in: connectionRequests.map((request) => request.user) },
  })
    .populate('topics')
    .populate('domains')
    .lean()

  const connectionRequest = connectionRequestUsers.map((user) => {
    const request = connectionRequests.find(
      (request) => request.user.toString() === user._id.toString()
    )
    return {
      user,
      message: request.message,
    }
  })

  res.status(200).json(connectionRequest)
})

// @desc    get connection request of student and user
// @route   Get
// @access  Private
const getConnections = asyncHandler(async (req, res) => {
  const { supervisorId } = req.params

  // Check if the user exists
  const user = await User.findById(supervisorId).lean()

  if (!user) {
    res.status(400).json({ message: 'User not found' })
  }

  const connectionIds = user.connections

  // Find all the users in the `connectionRequest` array and populate their information
  const connections = await User.find({
    _id: { $in: connectionIds },
  })
    .populate('topics')
    .populate('domains')
    .lean()

  res.status(200).json(connections)
})

export {
  getRecommendedSupervisors,
  sendConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  getOtherSupervisors,
  getConnectionsRequest,
  getConnections,
}
