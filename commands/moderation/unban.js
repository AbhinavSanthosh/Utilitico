const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const History = require('../../models/history'); // Import your History model

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unbans a user')
        .addStringOption(option => option.setName('userid').setDescription('The ID of the user to unban').setRequired(true)),
    
    async execute(interaction) {
        const userId = interaction.options.getString('userid');

        try {
            // Unban the user
            await interaction.guild.bans.remove(userId);
            
            // Create an embed for the unban notification
            const embed = new EmbedBuilder()
                .setTitle('User Unbanned')
                .setDescription(`User with ID ${userId} has been unbanned.`)
                .setColor('#008000')
                .setTimestamp();
            
            // Send the embed as a public message
            await interaction.reply({ embeds: [embed] });

            // Log the unban in MongoDB
            let history = await History.findOne({ userId, guildId: interaction.guild.id });

            if (!history) {
                // Create a new history record if it doesn't exist
                history = new History({
                    userId,
                    guildId: interaction.guild.id,
                    actions: [{ action: 'unban', moderator: interaction.user.tag, timestamp: new Date() }]
                });
            } else {
                // Update existing history record
                history.actions.push({ action: 'unban', moderator: interaction.user.tag, timestamp: new Date() });
            }

            // Save the history record to MongoDB
            await history.save();

        } catch (error) {
            console.error('Failed to unban user:', error); // Log the error for debugging
            await interaction.reply({ content: 'Failed to unban the user. Please check the ID.', ephemeral: true });
        }
    },
};
