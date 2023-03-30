import express from 'express'
import {
  getAllUsers,
  createNewUser,
  adminUpdateUser,
  deleteUser,
} from '../controllers/usersController.js'
import verifyJWT from '../middleware/verifyJWT.js'
import verifyRoles from '../middleware/verifyRoles.js'
import ROLES from '../config/roles.js'

const router = express.Router()

router.use(verifyJWT)
router.use(verifyRoles(ROLES.Admin))

router.route('/').get(getAllUsers).post(createNewUser)

router.route('/:id').patch(adminUpdateUser).delete(deleteUser)

export default router
