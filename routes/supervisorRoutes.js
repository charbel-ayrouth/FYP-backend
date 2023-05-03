import express from 'express'
import {
  getAllSupervisors,
  sendConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
} from '../controllers/supervisorController.js'
import verifyJWT from '../middleware/verifyJWT.js'
import verifyRoles from '../middleware/verifyRoles.js'
import ROLES from '../config/roles.js'

const router = express.Router()

router.use(verifyJWT)

router.get('/recommended/:userId', getAllSupervisors)
router.post('/:supervisorId/connect', sendConnectionRequest)
router.post('/:supervisorId/accept', acceptConnectionRequest)
router.post('/:supervisorId/decline', declineConnectionRequest)

export default router
