const verifyUser = (req, res, next) => {
  const { userId } = req.params
  if (!req?.id) return res.sendStatus(401)
  if (userId !== req?.id) return res.sendStatus(401)
  next()
}

export default verifyUser
