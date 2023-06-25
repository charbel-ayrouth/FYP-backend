import * as dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import rootRoutes from './routes/root.js'
import { logger, logEvents } from './middleware/logger.js'
import { errorHandler } from './middleware/errorHandler.js'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import corsOptions from './config/corsOption.js'
import connectDB from './config/dbConn.js'
import mongoose from 'mongoose'
import userRoutes from './routes/userRoutes.js'
import authRoutes from './routes/authRoutes.js'
import topicRoutes from './routes/topicRoutes.js'
import domainRoutes from './routes/domainRoutes.js'
import profileRoutes from './routes/profileRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import supervisorRoutes from './routes/supervisorRoutes.js'
import nodemailer from 'nodemailer'
import availabilityRoutes from './routes/availabilityRoutes.js'
import appointmentRoutes from './routes/appointmentRoutes.js'

const PORT = process.env.PORT || 3500
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const email = process.env.MAIL_USERNAME
const password = process.env.MAIL_PASSWORD

export let transporter = nodemailer.createTransport({
  host: 'smtp-mail.outlook.com',
  port: 587,
  secure: false,
  auth: {
    user: email,
    pass: password,
  },
})

const app = express()

connectDB()

// app.use(logger)
app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())

// tell express where to find static files
app.use('/', express.static(path.join(__dirname, '/public')))

// routing all request
app.use('/', rootRoutes)
app.use('/users', userRoutes)
app.use('/auth', authRoutes)
app.use('/topics', topicRoutes)
app.use('/domains', domainRoutes)
app.use('/profile', profileRoutes)
app.use('/notifications', notificationRoutes)
app.use('/supervisors', supervisorRoutes)
app.use('/availability', availabilityRoutes)
app.use('/appointments', appointmentRoutes)

// routing bad request
app.all('*', (req, res) => {
  res.status(404)
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, '/views', '404.html'))
  } else if (req.accepts('json')) {
    res.json({ message: '404 Not Found' })
  } else {
    res.type('txt').send('404 Not Found')
  }
})

// custom error handler always at the bottom
app.use(errorHandler)

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB')
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
})

mongoose.connection.on('error', (err) => {
  console.log(err)
  logEvents(
    `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
    'mongoErrLog.log'
  )
})
