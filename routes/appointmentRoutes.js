import express from 'express'
import {
  getAppointments,
  addAppointments,
} from '../controllers/appointmentController.js'

const router = express.Router()

router.route('/:userId').get(getAppointments).post(addAppointments)

export default router
