const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const { Schema } = mongoose;

const addressSchema = new Schema({
    country: {
        type: String,
    },
    state: {
        type: String,
    },
    city: {
        type: String,
    },
    location: {
        type: String,
    },
});

const groupSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    ownerId: {
        type: ObjectId,
        required: true
    },
    memebers: {
        type: [ObjectId],
    },
    profile: {
        type: String,
        required: true
    },
    banner: {
        type: String,
        required: true
    },
    address: addressSchema,
    disabled: {
        type: Boolean,
        default: false
    }
})

const GroupModel = mongoose.model('group', groupSchema);
module.exports = { GroupModel }