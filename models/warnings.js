const mongoose = require('mongoose');

const warningSchema = new mongoose.Schema({
    userId: String,
    guildId: String,
    warnings: [
        {
            reason: String,
            moderator: String,
            timestamp: { type: Date, default: Date.now },
        },
    ],
});

module.exports = mongoose.model('Warning', warningSchema);
