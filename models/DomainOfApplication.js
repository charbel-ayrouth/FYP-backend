import mongoose from 'mongoose'

const domainOfApplicationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  example: {
    type: String,
  },
})

const DomainOfApplication = mongoose.model(
  'DomainOfApplication',
  domainOfApplicationSchema
)

export default DomainOfApplication
