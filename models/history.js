const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    userId: String,
    guildId: String,
    actions: [
        {
            action: String,
            moderator: String,
            timestamp: { type: Date, default: Date.now },
        },
    ],
});

module.exports = mongoose.model('History', historySchema);
