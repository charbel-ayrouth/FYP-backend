import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['Student', 'Supervisor', 'Admin'],
      default: 'Student',
    },
    active: {
      type: Boolean,
      default: true,
    },
    topics: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TopicOfInterest',
      },
    ],
    domains: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DomainOfApplication',
      },
    ],
    connections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    connectionRequest: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        message: {
          type: String,
        },
      },
    ],
    setupComplete: {
      type: Boolean,
      default: false,
    },
    availability: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Availability',
      },
    ],
  },
  { timestamps: true }
)

const User = mongoose.model('User', userSchema)

export default User
