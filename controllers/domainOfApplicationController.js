import DomainOfApplication from '../models/DomainOfApplication.js'
import asyncHandler from 'express-async-handler'
import User from '../models/User.js'

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
// @desc add array of domains to user
// @route Post /user/:userId
// @access Private
const addDomainsToUser = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const { domainsIds } = req.body

  if (domainsIds.length !== 0) {
    return res.status(400).json({ message: 'Domains are required' })
  }

  const user = await User.findById(userId)

  // Find the domains in the database
  const domains = await DomainOfApplication.find({
    _id: { $in: domainsIds },
  })

  // Check if all domains exist
  if (domains.length !== domainsIds.length) {
    return res.status(400).json({ message: 'One or more domain not found' })
  }

  // Add the domains to the user's domains array
  domains.forEach((domain) => {
    if (user.domains.includes(domain._id)) {
      user.domains.push(domain._id)
    }
  })

  const updatedUser = await user.save()

  if (updatedUser) {
    res.status(201).json({ message: `Domains added to user profile` })
  } else {
    res.status(400).json({ message: 'Server error' })
  }
})

// @desc add array of domains to user
// @route Patch /user/:userId
// @access Private
const updateDomainsForUser = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const { domainsIds } = req.body

  const user = await User.findById(userId)

  // Find the domains in the database
  const domains = await TopicOfInterest.find({
    _id: { $in: domainsIds },
  })

  // Check if all domains exist
  if (domains.length !== domainsIds.length) {
    return res.status(400).json({ message: 'One or more domain not found' })
  }

  user.domains = domains.map((domain) => domain._id)

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
  addDomainsToUser,
  updateDomainsForUser,
}
