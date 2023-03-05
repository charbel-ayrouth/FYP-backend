import express from 'express'
import {
  getAllTopics,
  createNewTopic,
  updateTopic,
  deleteTopic,
} from '../controllers/topicOfInterestController.js'
import verifyJWT from '../middleware/verifyJWT.js'

const router = express.Router()

router.use(verifyJWT)

router
  .route('/')
  .get(getAllTopics)
  .post(createNewTopic)
  .patch(updateTopic)
  .delete(deleteTopic)

export default router
