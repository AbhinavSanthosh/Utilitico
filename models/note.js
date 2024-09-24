const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    userId: String,
    guildId: String,
    notes: [
        {
            note: String,
            moderator: String,
            timestamp: { type: Date, default: Date.now },
        },
    ],
});

module.exports = mongoose.model('Note', noteSchema);
