import express from 'express'
import {
  getAvailability,
  addAvailability,
  editAvailability,
  deleteAvailability,
} from '../controllers/availabilityController.js'

const router = express.Router()

router.route('/:supervisorId').get(getAvailability).post(addAvailability)

router
  .route('/:supervisorId/:availabilityId')
  .patch(editAvailability)
  .delete(deleteAvailability)

export default router
