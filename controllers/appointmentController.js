import Appointment from '../models/Appointment.js'
import asyncHandler from 'express-async-handler'

// @desc Get appointment
// @route Get
// @access Private
const getAppointments = asyncHandler(async (req, res) => {
  const { userId } = req.params

  const appointments = await Appointment.find({
    $or: [{ student: userId }, { supervisor: userId }],
  }).exec()

  res.json(appointments)
})

const addAppointments = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const { supervisorId, startTime, endTime } = req.body

  // Check if there is any future appointment between the same student and supervisor
  const existingAppointment = await Appointment.findOne({
    student: userId,
    supervisor: supervisorId,
    startTime: { $gte: new Date() }, // Check for future appointments only
  })

  if (existingAppointment) {
    return res
      .status(400)
      .json({
        error:
          'An appointment already exists in the future between the same student and supervisor',
      })
  }

  const appointment = new Appointment({
    student: userId,
    supervisor: supervisorId,
    startTime,
    endTime,
  })

  const savedAppointment = await appointment.save()

  res.status(201).json(savedAppointment)
})

export { getAppointments, addAppointments }
