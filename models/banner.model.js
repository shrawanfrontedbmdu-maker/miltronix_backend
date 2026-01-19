import mongoose from 'mongoose'

const bannerSchema = new mongoose.Schema({
    imageUrl: {
        type: String,
        required: true
    },
    imageAltText: {
        type: String
    },
    title:{
        type: String,
        required: true
    },
    description: {
        type: String
    },
    status: {
        type: String,
        enum: ["Active", "InActive", "Scheduled", "Expired"]
    },
    priority:{
        type: String,
        enum: ["High", "Normal", "Low"]
    },
    destinationUrl: {
        type: String,
    },
    bannerFor: {
        type: String
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    }

});

export default mongoose.model('Banner', bannerSchema)

