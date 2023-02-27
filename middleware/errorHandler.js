import { logEvents } from './logger.js'

// custom error handler that overide express error handler
export const errorHandler = (err, req, res, next) => {
  logEvents(
    `${err.name}: ${err.message}\t${req.method}\t${req.url}\t${req.headers.origin}`,
    'errLog.log'
  )
  console.log(err.stack)
  // if it does not have a statud code we change it to 500 (server error)
  const status = res.statusCode ? res.statusCode : 500
  // set status to what what we got
  res.status(status)
  res.json({ message: err.message, isError: true })
}
