import mongoose from 'mongoose'

const availabilitySchema = new mongoose.Schema({
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
})

const Availability = mongoose.model('Availability', availabilitySchema)

export default Availability
