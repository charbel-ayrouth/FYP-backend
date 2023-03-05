import mongoose from 'mongoose'

const topicOfInterestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
})

const TopicOfInterest = mongoose.model('TopicOfInterest', topicOfInterestSchema)

export default TopicOfInterest
