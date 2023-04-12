import Notification from '../models/Notifications.js'
import asyncHandler from 'express-async-handler'

// @desc get notifications of a user
// @route GET /:userId
// @access Private
const getNotifications = asyncHandler(async (req, res) => {
  const { userId } = req.params

  const notifications = await Notification.find({ user: userId }).sort({
    createdAt: -1,
  })

  res.json(notifications)
})

export { getNotifications }
