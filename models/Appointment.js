import mongoose from 'mongoose'

const appointmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
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
  },
  { timestamps: true }
)

const Appointment = mongoose.model('Appointment', appointmentSchema)

export default Appointment
