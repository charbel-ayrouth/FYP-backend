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

router.use(verifyJWT)

router
  .route('/')
  .get(getAllUsers)
  .post(createNewUser)
  .patch(adminUpdateUser)
  .delete(deleteUser)

router.route('/:id').patch(updateUser)

export default router
