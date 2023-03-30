import express from 'express'
import verifyJWT from '../middleware/verifyJWT.js'
import verifyRoles from '../middleware/verifyRoles.js'
import ROLES from '../config/roles.js'
import { updateProfile } from '../controllers/profileController.js'
import verifyUser from '../middleware/verifyUser.js'

const router = express.Router()

router.use(verifyJWT)
router.use(verifyRoles(ROLES.Student, ROLES.Supervisor))

router.route('/:userId').patch(verifyUser, updateProfile)

export default router
