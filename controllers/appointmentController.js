import Appointment from '../models/Appointment.js'
import asyncHandler from 'express-async-handler'
import { transporter } from '../server.js'
import User from '../models/User.js'
import { format, parseISO } from 'date-fns'

// @desc Get appointment
// @route Get
// @access Private
const getAppointments = asyncHandler(async (req, res) => {
  const { userId } = req.params

  const appointments = await Appointment.find({
    $or: [{ student: userId }, { supervisor: userId }],
  })
    .populate('student')
    .populate('supervisor')
    .exec()

  res.json(appointments)
})

const addAppointments = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const { supervisorId, startTime, endTime } = req.body

  const student = await User.findById(userId).exec()
  const supervisor = await User.findById(supervisorId).exec()

  if (!student || !supervisor) {
    return res.status(400).json({ message: 'User not found' })
  }

  // Check if there is any future appointment between the same student and supervisor
  const existingAppointment = await Appointment.findOne({
    student: userId,
    supervisor: supervisorId,
    startTime: { $gte: new Date() }, // Check for future appointments only
  })

  if (existingAppointment) {
    return res.status(400).json({
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

  const mailOptionsList = [
    {
      to: supervisor.email,
      from: process.env.MAIL_USERNAME,
      subject: 'Meeting with student',
      text: `${student.username} just scheduled a meeting with you on ${format(
        parseISO(startTime),
        "EEEE, MMMM d, yyyy 'at' h:mm a"
      )}`,
    },
    {
      to: student.email,
      from: process.env.MAIL_USERNAME,
      subject: 'Meeting with Supervisor',
      text: `you scheduled a meeting with ${supervisor.username} on ${format(
        parseISO(startTime),
        "EEEE, MMMM d, yyyy 'at' h:mm a"
      )}`,
    },
  ]

  Promise.all(
    mailOptionsList.map((mailOptions) => {
      return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, function (err, data) {
          if (err) {
            console.log('Error sending email:', err)
            reject(err)
          } else {
            console.log('Email sent successfully')
            resolve(data)
          }
        })
      })
    })
  )
    .then(() => {
      res.status(200).json({ message: 'Emails sent successfully' })
      res.status(201).json(savedAppointment)
    })
    .catch((error) => {
      res.status(400).json({ message: 'Error sending emails' })
    })
})

export { getAppointments, addAppointments }
