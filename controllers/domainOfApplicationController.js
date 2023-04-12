import DomainOfApplication from '../models/DomainOfApplication.js'
import asyncHandler from 'express-async-handler'
import User from '../models/User.js'
import Notification from '../models/Notifications.js'
import notificationsType from '../config/notificationsType.js'

// @desc Get all domains of app
// @route Get /domains
// @access Private
const getAllDomains = asyncHandler(async (req, res) => {
  const domains = await DomainOfApplication.find().lean()

  if (!domains.length) {
    return res.status(400).json({ message: 'No Domain found' })
  }
  res.json(domains)
})

// @desc Create new domain
// @route Post /domains
// @access Private
const createNewDomain = asyncHandler(async (req, res) => {
  const { title, example } = req.body

  if (!title) {
    return res.status(400).json({ message: 'Title field is required' })
  }

  const duplicate = await DomainOfApplication.findOne({ title }).lean().exec()
  if (duplicate) {
    return res.status(409).json({ message: 'Duplicate title' })
  }

  const domain = await DomainOfApplication.create({ title, example })

  if (domain) {
    // Send notifications to all the students and supervisors
    const users = await User.find({ role: { $in: ['Student', 'Supervisor'] } })
      .lean()
      .exec()

    const notifications = []

    const existingNotifications = await Notification.find({
      type: notificationsType.newDomain,
    })

    users.forEach((user) => {
      const notificationExists = existingNotifications.some(
        (existingNotification) =>
          existingNotification.user.toString() === user._id.toString()
      )
      if (!notificationExists) {
        const notification = {
          user: user._id,
          message: `New domain of application has been added`,
          read: false,
          type: notificationsType.newDomain,
        }
        notifications.push(notification)
      }
    })

    await Notification.insertMany(notifications)

    res.status(201).json({ message: `New domain: ${domain.title} created` })
  } else {
    res.status(400).json({ message: 'Invalid domain data received' })
  }
})

// @desc Update a domain
// @route PATCH /domains
// @access Private
const updateDomain = async (req, res) => {
  const { id } = req.params
  const { title, example } = req.body

  if (!id || !title) {
    return res.status(400).json({ message: 'All fields are required' })
  }

  const domain = await DomainOfApplication.findById(id).exec()

  if (!domain) {
    return res.status(400).json({ message: 'Domain not found' })
  }

  const duplicate = await DomainOfApplication.findOne({ title })
    .collation({ locale: 'en', strength: 2 })
    .lean()
    .exec()

  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: 'Duplicate domain title' })
  }

  domain.title = title
  if (example) {
    domain.example = example
  }

  const updatedDomain = await domain.save()

  if (updateDomain) {
    // Send notifications to all the students and supervisors
    const users = await User.find({ role: { $in: ['Student', 'Supervisor'] } })
      .lean()
      .exec()

    const notifications = []

    const existingNotifications = await Notification.find({
      type: notificationsType.updateDomain,
    })

    users.forEach((user) => {
      const notificationExists = existingNotifications.some(
        (existingNotification) =>
          existingNotification.user.toString() === user._id.toString()
      )
      if (!notificationExists) {
        const notification = {
          user: user._id,
          message: `A domain of application has been updated`,
          read: false,
          type: notificationsType.updateDomain,
        }
        notifications.push(notification)
      }
    })

    await Notification.insertMany(notifications)
  }

  res.json(`'${updatedDomain.title}' updated`)
}

// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteDomain = async (req, res) => {
  const { id } = req.params

  if (!id) {
    return res.status(400).json({ message: 'Domain ID Required' })
  }

  const domain = await DomainOfApplication.findById(id).exec()

  if (!domain) {
    return res.status(400).json({ message: 'Domain not found' })
  }

  const result = await domain.deleteOne()

  const reply = `Domain '${result.title}' with ID ${result._id} deleted`

  res.json(reply)
}

//! /user
// @desc get array of domains of a user
// @route GET /user/:userId
// @access Private
const getDomainsOfUser = asyncHandler(async (req, res) => {
  const { userId } = req.params

  const user = await User.findById(userId)

  const domains = user.domains

  res.json(domains)
})

// @desc add or update array of domains for user
// @route Post /user/:userId
// @access Private
const addOrUpdateDomainsForUser = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const { selectedDomains } = req.body

  if (selectedDomains.length === 0) {
    return res.status(400).json({ message: 'Domains are required' })
  }

  const user = await User.findById(userId)

  // Find the domains in the database
  const domains = await DomainOfApplication.find({
    _id: { $in: selectedDomains },
  })

  // Check if all domains exist
  if (domains.length !== selectedDomains.length) {
    return res.status(400).json({ message: 'One or more domains not found' })
  }

  // Remove any existing domains that were not selected
  user.domains = user.domains.filter((domain) =>
    selectedDomains.includes(domain.toString())
  )

  // Add the selected domains to the user's domains array
  domains.forEach((domain) => {
    if (!user.domains.includes(domain._id)) {
      user.domains.push(domain._id)
    }
  })

  const updatedUser = await user.save()

  if (updatedUser) {
    res.status(201).json({ message: `Domains updated for user profile` })
  } else {
    res.status(400).json({ message: 'Server error' })
  }
})

export {
  getAllDomains,
  createNewDomain,
  updateDomain,
  deleteDomain,
  getDomainsOfUser,
  addOrUpdateDomainsForUser,
}
