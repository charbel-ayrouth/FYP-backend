import express from 'express'
import verifyJWT from '../middleware/verifyJWT.js'
import verifyRoles from '../middleware/verifyRoles.js'
import verifyUser from '../middleware/verifyUser.js'
import {
  getNotifications,
  readNotifications,
  markNotificationAsRead,
} from '../controllers/notificationController.js'

const router = express.Router()

// router.use(verifyJWT)

router
  .route('/:userId')
  .get(getNotifications)
  .post(readNotifications)
  .patch(markNotificationAsRead)

export default router
