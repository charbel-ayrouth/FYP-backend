import express from 'express'
import {
  getAllDomains,
  createNewDomain,
  updateDomain,
  deleteDomain,
} from '../controllers/domainOfApplicationController.js'
import verifyJWT from '../middleware/verifyJWT.js'

const router = express.Router()

router.use(verifyJWT)

router.route('/').get(getAllDomains).post(createNewDomain)

router.route('/:id').patch(updateDomain).delete(deleteDomain)

export default router
