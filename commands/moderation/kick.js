const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const History = require('../../models/history'); // Import the MongoDB model

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

                // Log the kick action in MongoDB
                await History.findOneAndUpdate(
                    { userId: target.id, guildId: interaction.guild.id },
                    {
                        $push: {
                            actions: {
                                action: 'kick',
                                moderator: interaction.user.tag,
                                timestamp: new Date(),
                            },
                        },
                    },
                    { upsert: true } // Creates a new record if no history exists for this user
                );

                // Create an embed for the kick confirmation
                const embed = new EmbedBuilder()
                    .setTitle('User Kicked')
                    .setDescription(`${target.tag} has been kicked.`)
                    .setColor('#FFA500')
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
