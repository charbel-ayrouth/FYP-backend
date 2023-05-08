import express from 'express'
import {
  getRecommendedSupervisors,
  sendConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  getOtherSupervisors,
  getConnectionsRequest,
} from '../controllers/supervisorController.js'
import verifyJWT from '../middleware/verifyJWT.js'
import verifyRoles from '../middleware/verifyRoles.js'
import ROLES from '../config/roles.js'

const router = express.Router()

// router.use(verifyJWT)

router.get('/recommended/:userId', getRecommendedSupervisors)
router.get('/other/:userId', getOtherSupervisors)

router.post('/:supervisorId/connect', sendConnectionRequest)
router.post('/:supervisorId/accept', acceptConnectionRequest)
router.post('/:supervisorId/decline', declineConnectionRequest)

router.get('/:supervisorId/connections-request', getConnectionsRequest)

export default router
