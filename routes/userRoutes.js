import express from 'express'
import {
  getAllUsers,
  createNewUser,
  adminUpdateUser,
  deleteUser,
  updateUser,
} from '../controllers/usersController.js'
import verifyJWT from '../middleware/verifyJWT.js'

const router = express.Router()

// router.use(verifyJWT)

router.route('/').get(getAllUsers).post(createNewUser)

router.route('/:id').patch(adminUpdateUser).delete(deleteUser)

export default router
