import mongoose from 'mongoose'

const domainOfApplicationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    example: {
      type: String,
    },
  },
  { timestamps: true }
)

const DomainOfApplication = mongoose.model(
  'DomainOfApplication',
  domainOfApplicationSchema
)

export default DomainOfApplication
