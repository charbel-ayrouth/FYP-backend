import express from 'express'
import {
  getAllTopics,
  createNewTopic,
  updateTopic,
  deleteTopic,
  getTopicsOfUser,
  addOrUpdateTopicsForUser,
} from '../controllers/topicOfInterestController.js'
import verifyJWT from '../middleware/verifyJWT.js'
import verifyRoles from '../middleware/verifyRoles.js'
import ROLES from '../config/roles.js'
import verifyUser from '../middleware/verifyUser.js'

const router = express.Router()

router.use(verifyJWT)

router
  .route('/')
  .get(getAllTopics)
  .post(verifyRoles(ROLES.Admin), createNewTopic)

router
  .route('/:id')
  .patch(verifyRoles(ROLES.Admin), updateTopic)
  .delete(verifyRoles(ROLES.Admin), deleteTopic)

router
  .route('/user/:userId')
  .post(
    verifyRoles(ROLES.Student, ROLES.Supervisor),
    verifyUser,
    addOrUpdateTopicsForUser
  )
  .get(
    verifyRoles(ROLES.Student, ROLES.Supervisor),
    verifyUser,
    getTopicsOfUser
  )

export default router
