import express from 'express'
import {
  getAllTopics,
  createNewTopic,
  updateTopic,
  deleteTopic,
  addTopicsToUser,
} from '../controllers/topicOfInterestController.js'
import verifyJWT from '../middleware/verifyJWT.js'

const router = express.Router()

// router.use(verifyJWT)

router.route('/').get(getAllTopics).post(createNewTopic)

router.route('/:id').patch(updateTopic).delete(deleteTopic)

router.route('/user/:userId').post(addTopicsToUser)

export default router
