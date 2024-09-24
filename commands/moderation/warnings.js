const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Warning = require('../../models/warnings'); // The Warning model

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('View warnings of a user')
        .addUserOption(option => option.setName('target').setDescription('The user to view warnings for').setRequired(true)),

    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const guildId = interaction.guild.id;

        // Check for permissions
        if (!interaction.member.permissions.has('MANAGE_MESSAGES')) {
            return interaction.reply({ content: 'You don’t have permission to view warnings.', ephemeral: true });
        }

        try {
            const warningRecord = await Warning.findOne({ userId: target.id, guildId });

            if (!warningRecord || warningRecord.warnings.length === 0) {
                return interaction.reply({ content: `No warnings found for **${target.tag}**.`, ephemeral: true });
            }

            // Create an embed for the warning details
            const embed = new EmbedBuilder()
                .setTitle(`Warnings for ${target.tag}`)
                .setDescription(warningRecord.warnings.map((warning, index) => 
                    `${index + 1}. ${warning.reason} (by ${warning.moderator} at ${new Date(warning.timestamp).toLocaleString()})`
                ).join('\n'))
                .setColor('#FFA500')
                .setTimestamp();

            // Send the embed as a public message
            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error fetching warnings:', error);
            return interaction.reply({ content: 'An error occurred while fetching the warnings. Please try again later.', ephemeral: true });
        }
    },
};
