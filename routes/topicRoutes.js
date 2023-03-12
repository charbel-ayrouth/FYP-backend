import express from 'express'
import {
  getAllTopics,
  createNewTopic,
  updateTopic,
  deleteTopic,
  addTopicsToUser,
} from '../controllers/topicOfInterestController.js'
import verifyJWT from '../middleware/verifyJWT.js'
import verifyRole from '../middleware/verifyRoles.js'
import ROLES from '../config/roles.js'

const router = express.Router()

router.use(verifyJWT)

router
  .route('/')
  .get(verifyRole(ROLES.Supervisor, ROLES.Student), getAllTopics)
  .post(createNewTopic)

router.route('/:id').patch(updateTopic).delete(deleteTopic)

router.route('/user/:userId').post(addTopicsToUser)

export default router
