import TopicOfInterest from '../models/TopicOfInterest.js'
import asyncHandler from 'express-async-handler'
import User from '../models/User.js'

// @desc Get all topics
// @route Get /topics
// @access Private
const getAllTopics = asyncHandler(async (req, res) => {
  const topics = await TopicOfInterest.find().lean()

  if (!topics?.length) {
    return res.status(400).json({ message: 'No topics found' })
  }
  res.json(topics)
})

// @desc Create new topic
// @route Post /topics
// @access Private
const createNewTopic = asyncHandler(async (req, res) => {
  const { title } = req.body

  if (!title) {
    return res.status(400).json({ message: 'Title field is required' })
  }

  const duplicate = await TopicOfInterest.findOne({ title })
    .collation({ locale: 'en', strength: 2 })
    .lean()
    .exec()

  if (duplicate) {
    return res.status(409).json({ message: 'Duplicate topic title' })
  }

  const topic = await TopicOfInterest.create({ title })

  if (topic) {
    res.status(201).json({ message: `New topic: ${topic.title} created` })
  } else {
    res.status(400).json({ message: 'Invalid topic data received' })
  }
})

// @desc update topic
// @route Patch /topics
// @access Private
const updateTopic = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { title } = req.body

  if (!id || !title) {
    return res.status(400).json({ message: 'All fields are required' })
  }

  const topic = await TopicOfInterest.findById(id).exec()

  if (!topic) return res.status(400).json({ message: 'Topic not found' })

  const duplicateTitle = await TopicOfInterest.findOne({ title })
    .collation({ locale: 'en', strength: 2 })
    .lean()
    .exec()
  if (duplicateTitle && duplicateTitle._id.toString() !== id) {
    return res.status(409).json({ message: 'Duplicate title' })
  }

  topic.title = title

  const updatedTopic = await topic.save()

  res.json({ message: `${updatedTopic.title} updated` })
})

// @desc Delete a topic
// @route Delete /topics
// @access Private
const deleteTopic = asyncHandler(async (req, res) => {
  const { id } = req.params

  if (!id) {
    return res.status(400).json({ message: 'Topic id required' })
  }

  const topic = await TopicOfInterest.findById(id).exec()

  if (!topic) {
    return res.status(400).json({ message: 'Topic not found' })
  }

  const result = await topic.deleteOne()

  const reply = `${result.title} with ID ${result._id} deleted`

  res.json(reply)
})

//! /user
// @desc get array of topics of a user
// @route GET /user/:userId
// @access Private
const getTopicsOfUser = asyncHandler(async (req, res) => {
  const { userId } = req.params

  const user = await User.findById(userId)

  const topics = user.topics

  // if (!topics?.length) {
  //   return res.status(400).json({ message: 'No topics found' })
  // }
  res.json(topics)
})

// @desc add or update array of topics for user
// @route Post /user/:userId
// @access Private
const addOrUpdateTopicsForUser = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const { selectedTopics } = req.body

  if (selectedTopics.length === 0) {
    return res.status(400).json({ message: 'Topics are required' })
  }

  const user = await User.findById(userId)

  // Find the topics in the database
  const topics = await TopicOfInterest.find({
    _id: { $in: selectedTopics },
  })

  // Check if all topics exist
  if (topics.length !== selectedTopics.length) {
    return res.status(400).json({ message: 'One or more topics not found' })
  }

  // Remove any existing topics that were not selected
  user.topics = user.topics.filter((topic) =>
    selectedTopics.includes(topic.toString())
  )

  // Add the selected topics to the user's topics array
  topics.forEach((topic) => {
    if (!user.topics.includes(topic._id)) {
      user.topics.push(topic._id)
    }
  })

  const updatedUser = await user.save()

  if (updatedUser) {
    res.status(201).json({ message: `Topics updated for user profile` })
  } else {
    res.status(400).json({ message: 'Server error' })
  }
})

export {
  getAllTopics,
  createNewTopic,
  updateTopic,
  deleteTopic,
  getTopicsOfUser,
  addOrUpdateTopicsForUser,
}
