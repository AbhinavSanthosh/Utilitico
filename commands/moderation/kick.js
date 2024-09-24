const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const connection = require('../../config/mysql'); // Import your MySQL connection

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kicks a user')
        .addUserOption(option => option.setName('target').setDescription('The user to kick').setRequired(true)),
    
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const member = interaction.guild.members.cache.get(target.id);

        // Check if the member exists in the guild
        if (member) {
            // Attempt to kick the member
            try {
                await member.kick();
                
                // Log the kick action in MySQL
                const query = 'INSERT INTO history (userId, guildId, action, moderator, timestamp) VALUES (?, ?, ?, ?, ?)';
                const values = [target.id, interaction.guild.id, 'kick', interaction.user.tag, new Date()];

                connection.query(query, values, (err) => {
                    if (err) {
                        console.error('Error logging kick action to MySQL:', err);
                    }
                });

                // Create an embed for the kick confirmation
                const embed = new EmbedBuilder()
                    .setTitle('User Kicked')
                    .setDescription(`${target.tag} has been kicked.`)
                    .setColor('#FFA500') // Added '#' for color code
                    .setTimestamp();

                // Send the embed as a public message
                await interaction.reply({ embeds: [embed] });
            } catch (error) {
                // If there's an error, respond with a message
                await interaction.reply({ content: `Failed to kick the user: ${error.message}`, ephemeral: true });
            }
        } else {
            // Respond if the user is not found in the guild
            await interaction.reply({ content: 'User not found.', ephemeral: true });
        }
    },
};
