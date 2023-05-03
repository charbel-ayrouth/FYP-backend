import express from 'express'
import {
  getAllUsers,
  createNewUser,
  adminUpdateUser,
  deleteUser,
  accountSetupComplete,
} from '../controllers/usersController.js'
import verifyJWT from '../middleware/verifyJWT.js'
import verifyRoles from '../middleware/verifyRoles.js'
import ROLES from '../config/roles.js'

const router = express.Router()

router.use(verifyJWT)

router
  .route('/')
  .get(verifyRoles(ROLES.Admin), getAllUsers)
  .post(verifyRoles(ROLES.Admin), createNewUser)

router
  .route('/:id')
  .patch(verifyRoles(ROLES.Admin), adminUpdateUser)
  .delete(verifyRoles(ROLES.Admin), deleteUser)
  .get(accountSetupComplete)

export default router
