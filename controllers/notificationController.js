import Notification from '../models/Notifications.js'
import asyncHandler from 'express-async-handler'

// @desc get notifications of a user
// @route GET /:userId
// @access Private
const getNotifications = asyncHandler(async (req, res) => {
  const { userId } = req.params

  const notifications = await Notification.find({ user: userId })
    .sort({
      createdAt: 'desc',
    })
    .lean()
    .exec()

  res.json(notifications)
})

// @desc mark notifications as read
// @route POST /:userId
// @access Private
const readNotifications = asyncHandler(async (req, res) => {
  const { userId } = req.params
  try {
    await Notification.updateMany({ user: userId }, { read: true })
    res.status(201).json({ message: `Notifications marked as read` })
  } catch (error) {
    res
      .status(400)
      .json({ message: `Error marking notifications as read: ${error}` })
  }
})

// @desc mark notifications as read
// @route PATCH /:userId
// @access PrivatenotificationId
const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.body
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId },
      { read: true },
      { new: true }
    )
    res.status(201).json(notification)
  } catch (error) {
    res
      .status(400)
      .json({ message: `Error marking notification as read: ${error}` })
  }
})

export { getNotifications, readNotifications, markNotificationAsRead }
