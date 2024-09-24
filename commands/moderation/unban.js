const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const connection = require('../../config/mysql'); // Import your MySQL connection

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

            // Log the unban in MySQL
            const query = 'INSERT INTO history (userId, guildId, actions) VALUES (?, ?, ?)';
            const values = [userId, interaction.guild.id, JSON.stringify([{ action: 'unban', moderator: interaction.user.tag, timestamp: new Date() }])];

            await new Promise((resolve, reject) => {
                connection.query(query, values, (err) => {
                    if (err) {
                        console.error('Error logging unban action:', err);
                        return reject('An error occurred while logging the unban.');
                    }
                    resolve();
                });
            });

        } catch (error) {
            console.error('Failed to unban user:', error); // Log the error for debugging
            await interaction.reply({ content: 'Failed to unban the user. Please check the ID.', ephemeral: true });
        }
    },
};
