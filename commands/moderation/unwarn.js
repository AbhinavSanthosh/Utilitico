const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Warning = require('../../models/warnings'); // MongoDB model for warnings

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unwarn')
        .setDescription('Remove a specific warning from a user by index')
        .addUserOption(option => option.setName('target').setDescription('The user to unwarn').setRequired(true))
        .addIntegerOption(option => option.setName('index').setDescription('Index of the warning to remove').setRequired(true)),

    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const index = interaction.options.getInteger('index') - 1; // Adjust index for zero-based array
        const guildId = interaction.guild.id;

        if (!interaction.member.permissions.has('MANAGE_MESSAGES')) {
            return interaction.reply({ content: 'You don’t have permission to unwarn users.', ephemeral: true });
        }

        const warningRecord = await Warning.findOne({ userId: target.id, guildId });

        if (!warningRecord || warningRecord.warnings.length === 0) {
            return interaction.reply({ content: `No warnings found for **${target.tag}**.`, ephemeral: true });
        }

        if (index < 0 || index >= warningRecord.warnings.length) {
            return interaction.reply({ content: 'Invalid warning index.', ephemeral: true });
        }

        // Remove the warning
        const removedWarning = warningRecord.warnings.splice(index, 1)[0]; // Store the removed warning for logging

        await warningRecord.save();

        // Optionally log the unwarn action in a logging system (you could set up a separate MongoDB model for logs)
        // This example logs directly into the warnings collection
        const logEntry = {
            userId: target.id,
            guildId,
            action: 'unwarn',
            warning: removedWarning,
            moderator: interaction.user.tag,
            timestamp: new Date(),
        };
        await Warning.updateOne(
            { userId: target.id, guildId },
            { $push: { log: logEntry } } // Assuming you have a 'log' field in your Warning model to store logs
        );

        // Create an embed for the unwarn notification
        const embed = new EmbedBuilder()
            .setTitle('Warning Removed')
            .setDescription(`Warning has been removed from **${target.tag}**.`)
            .setColor('#FFA500')
            .setTimestamp();

        // Send the embed as a public message
        await interaction.reply({ embeds: [embed] });
    },
};
