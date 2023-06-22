import express from 'express'
import {
  getRecommendedSupervisors,
  sendConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  getOtherSupervisors,
  getConnectionsRequest,
  getConnections,
} from '../controllers/supervisorController.js'
import verifyJWT from '../middleware/verifyJWT.js'
import verifyRoles from '../middleware/verifyRoles.js'
import ROLES from '../config/roles.js'

const router = express.Router()

// router.use(verifyJWT)

router.get('/recommended/:userId', getRecommendedSupervisors)
router.get('/other/:userId', getOtherSupervisors)

router.post('/:supervisorId/accept', acceptConnectionRequest)
router.post('/:supervisorId/connect', sendConnectionRequest)
router.post('/:supervisorId/decline', declineConnectionRequest)

router.get('/:supervisorId/connections-request', getConnectionsRequest)
router.get('/:supervisorId/connections', getConnections)

export default router
