const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const History = require('../../models/history'); // Import the Mongoose model

module.exports = {
    data: new SlashCommandBuilder()
        .setName('history')
        .setDescription('Shows the moderation history of a user')
        .addUserOption(option => option.setName('target').setDescription('The user to check').setRequired(true)),

    async execute(interactionOrMessage) {
        const target = interactionOrMessage.options?.getUser('target') || interactionOrMessage.message.mentions.users.first();
        const guild = interactionOrMessage.guild;

        // Fetch the moderation history from MongoDB
        try {
            const history = await History.findOne({ userId: target.id, guildId: guild.id });

            // Create an embed for displaying the history
            const embed = new EmbedBuilder()
                .setTitle(`Moderation History for ${target.tag}`)
                .setColor('#0000FF');

            // Check if the user has any moderation history
            if (!history || history.actions.length === 0) {
                embed.setDescription('No moderation actions found.');
            } else {
                // Format the actions into a readable format
                const actionsList = history.actions.map(a =>
                    `**Action:** ${a.action}\n**Moderator:** ${a.moderator}\n**Timestamp:** ${new Date(a.timestamp).toLocaleString()}`).join('\n\n');
                embed.setDescription(actionsList);
            }

            // Send the embed as a public message
            await interactionOrMessage.reply({ embeds: [embed] });
        } catch (err) {
            console.error('Error fetching history from MongoDB:', err);
            return interactionOrMessage.reply({ content: 'An error occurred while fetching history.', ephemeral: true });
        }
    },
};
