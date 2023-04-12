import express from 'express'
import {
  getAllDomains,
  createNewDomain,
  updateDomain,
  deleteDomain,
  getDomainsOfUser,
  addOrUpdateDomainsForUser,
} from '../controllers/domainOfApplicationController.js'
import verifyJWT from '../middleware/verifyJWT.js'
import verifyRoles from '../middleware/verifyRoles.js'
import ROLES from '../config/roles.js'
import verifyUser from '../middleware/verifyUser.js'

const router = express.Router()

router.use(verifyJWT)

router
  .route('/')
  .get(getAllDomains)
  .post(verifyRoles(ROLES.Admin), createNewDomain)

router
  .route('/:id')
  .patch(verifyRoles(ROLES.Admin), updateDomain)
  .delete(verifyRoles(ROLES.Admin), deleteDomain)

router
  .route('/user/:userId')
  .post(
    verifyRoles(ROLES.Student, ROLES.Supervisor),
    verifyUser,
    addOrUpdateDomainsForUser
  )
  .get(
    verifyRoles(ROLES.Student, ROLES.Supervisor),
    verifyUser,
    getDomainsOfUser
  )

export default router
