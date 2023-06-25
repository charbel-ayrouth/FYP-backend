import Availability from '../models/Availability.js'
import asyncHandler from 'express-async-handler'
import User from '../models/User.js'

// @desc Get supervisor availability
// @route Get
// @access Private
const getAvailability = asyncHandler(async (req, res) => {
  const { supervisorId } = req.params
  const slots = await Availability.find({ supervisor: supervisorId })
    .populate('supervisor')
    .exec()

  res.json(slots)
})

// @desc Add supervisor availability
// @route Add
// @access Private
const addAvailability = asyncHandler(async (req, res) => {
  const { supervisorId } = req.params
  const { startTime, endTime } = req.body

  // Create a new availability object
  const availability = new Availability({
    supervisor: supervisorId,
    startTime,
    endTime,
  })

  // Save the availability object to the database
  await availability.save()

  res.status(201).json({ message: 'Availability added successfully' })
})

// @desc Edit supervisor availability
// @route Patch
// @access Private
const editAvailability = asyncHandler(async (req, res) => {
  const { supervisorId, availabilityId } = req.params
  const { startTime, endTime } = req.body

  // Find the availability entry by supervisor ID and availability ID
  const availability = await Availability.findOne({
    supervisor: supervisorId,
    _id: availabilityId,
  })

  if (!availability) {
    res.status(404).json({ message: 'Availability not found' })
  }

  // Update the availability entry
  availability.startTime = startTime
  availability.endTime = endTime

  // Save the updated availability object to the database
  await availability.save()

  res.json({ message: 'Availability updated successfully' })
})

const deleteAvailability = asyncHandler(async (req, res) => {
  const { supervisorId, availabilityId } = req.params

  // Find the availability entry by supervisor ID and availability ID
  const availability = await Availability.findOneAndDelete({
    supervisor: supervisorId,
    _id: availabilityId,
  })

  if (!availability) {
    res.status(404).json({ message: 'Availability not found' })
  }

  res.json({ message: 'Availability deleted successfully' })
})

const getConnectedSupervisorsAvailability = asyncHandler(async (req, res) => {
  const { studentId } = req.params
  const student = await User.findById(studentId).populate('connections')

  const supervisorIds = student.connections.map((connection) => connection._id)

  const slots = await Availability.find({ supervisor: { $in: supervisorIds } })
    .populate('supervisor')
    .exec()

  res.json(slots)
})

export {
  getAvailability,
  addAvailability,
  editAvailability,
  deleteAvailability,
  getConnectedSupervisorsAvailability,
}
