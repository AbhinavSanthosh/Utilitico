const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const connection = require('../../config/mysql'); // Import your MySQL connection

module.exports = {
    data: new SlashCommandBuilder()
        .setName('history')
        .setDescription('Shows the moderation history of a user')
        .addUserOption(option => option.setName('target').setDescription('The user to check').setRequired(true)),

    async execute(interactionOrMessage) {
        const target = interactionOrMessage.options?.getUser('target') || interactionOrMessage.message.mentions.users.first();
        const guild = interactionOrMessage.guild;

        // Fetch the history from MySQL
        const query = 'SELECT action, moderator, timestamp FROM history WHERE userId = ? AND guildId = ?';
        const values = [target.id, guild.id];

        connection.query(query, values, async (err, results) => {
            if (err) {
                console.error('Error fetching history from MySQL:', err);
                return interactionOrMessage.reply({ content: 'An error occurred while fetching history.', ephemeral: true });
            }

            // Create an embed for displaying the history
            const embed = new EmbedBuilder()
                .setTitle(`Moderation History for ${target.tag}`)
                .setColor('#0000FF');

            // Check if the user has any moderation history
            if (results.length === 0) {
                embed.setDescription('No moderation actions found.');
            } else {
                // Format the actions into a readable format
                const actionsList = results.map(a => 
                    `**Action:** ${a.action}\n**Moderator:** ${a.moderator}\n**Timestamp:** ${new Date(a.timestamp).toLocaleString()}`).join('\n\n');
                embed.setDescription(actionsList);
            }

            // Send the embed as a public message
            await interactionOrMessage.reply({ embeds: [embed] }); // Made public by removing ephemeral: true
        });
    },
};
