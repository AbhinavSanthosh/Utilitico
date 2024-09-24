const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Warning = require('../../models/warnings'); // The Warning model
const connection = require('../../config/mysql'); // Import your MySQL connection

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unwarn')
        .setDescription('Remove a specific warning from a user by index')
        .addUserOption(option => option.setName('target').setDescription('The user to unwarn').setRequired(true))
        .addIntegerOption(option => option.setName('index').setDescription('Index of the warning to remove').setRequired(true)),

    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const index = interaction.options.getInteger('index') - 1;
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

        // Log the unwarn action in MySQL (optional)
        const query = 'INSERT INTO warning_logs (userId, guildId, action, warning) VALUES (?, ?, ?, ?)';
        const values = [target.id, guildId, 'unwarn', JSON.stringify(removedWarning)];

        await new Promise((resolve, reject) => {
            connection.query(query, values, (err) => {
                if (err) {
                    console.error('Error logging unwarn action:', err);
                    return reject('An error occurred while logging the unwarn action.');
                }
                resolve();
            });
        });

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
