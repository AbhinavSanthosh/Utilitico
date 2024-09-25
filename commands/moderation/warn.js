const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Warning = require('../../models/warnings'); // MongoDB model for warnings

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user')
        .addUserOption(option => option.setName('target').setDescription('The user to warn').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason for the warning').setRequired(true)),

    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason');

        if (!interaction.member.permissions.has('MANAGE_MESSAGES')) {
            return interaction.reply({ content: 'You don’t have permission to warn users.', ephemeral: true });
        }

        const guildId = interaction.guild.id;
        let warningRecord = await Warning.findOne({ userId: target.id, guildId });

        // If no record exists, create one
        if (!warningRecord) {
            warningRecord = new Warning({
                userId: target.id,
                guildId,
                warnings: [{ reason, moderator: interaction.user.tag, timestamp: new Date() }],
            });
            await warningRecord.save();
        } else {
            // Push the new warning to the existing record
            warningRecord.warnings.push({ reason, moderator: interaction.user.tag, timestamp: new Date() });
            await warningRecord.save();
        }

        // Create an embed for the warning notification
        const embed = new EmbedBuilder()
            .setTitle('User Warned')
            .setDescription(`**${target.tag}** has been warned for: ${reason}`)
            .setColor('#FFA500')
            .setTimestamp();

        // Send the embed as a public message
        await interaction.reply({ embeds: [embed] });
    },
};
