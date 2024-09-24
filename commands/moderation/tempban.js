const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const connection = require('../../config/mysql'); // Import your MySQL connection

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tempban')
        .setDescription('Temporarily bans a user')
        .addUserOption(option => option.setName('target').setDescription('The user to tempban').setRequired(true))
        .addIntegerOption(option => option.setName('duration').setDescription('Duration of the ban in minutes').setRequired(true)),

    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const duration = interaction.options.getInteger('duration');
        const guild = interaction.guild;

        const member = guild.members.cache.get(target.id);
        if (!member) return interaction.reply({ content: 'User not found!', ephemeral: true });

        // Ban the user
        await member.ban();

        // Log the temporary ban in MySQL
        const query = 'SELECT * FROM history WHERE userId = ? AND guildId = ?';
        const values = [target.id, guild.id];
        
        let history;

        // Check if history exists
        await new Promise((resolve, reject) => {
            connection.query(query, values, (err, results) => {
                if (err) {
                    console.error('Error fetching history record:', err);
                    return reject('An error occurred while fetching the history record.');
                }
                history = results[0] || null; // Grab the first result or null if not found
                resolve();
            });
        });

        if (!history) {
            // Insert new history record if it doesn't exist
            const insertQuery = 'INSERT INTO history (userId, guildId, actions) VALUES (?, ?, ?)';
            const insertValues = [
                target.id,
                guild.id,
                JSON.stringify([{ action: `tempban (${duration} minutes)`, moderator: interaction.user.tag }]) // Store as JSON
            ];

            await new Promise((resolve, reject) => {
                connection.query(insertQuery, insertValues, (err) => {
                    if (err) {
                        console.error('Error inserting new history record:', err);
                        return reject('An error occurred while logging the ban.');
                    }
                    resolve();
                });
            });
        } else {
            // Update existing history record
            const updatedActions = JSON.parse(history.actions);
            updatedActions.push({ action: `tempban (${duration} minutes)`, moderator: interaction.user.tag });

            const updateQuery = 'UPDATE history SET actions = ? WHERE userId = ? AND guildId = ?';
            const updateValues = [JSON.stringify(updatedActions), target.id, guild.id];

            await new Promise((resolve, reject) => {
                connection.query(updateQuery, updateValues, (err) => {
                    if (err) {
                        console.error('Error updating history record:', err);
                        return reject('An error occurred while updating the history.');
                    }
                    resolve();
                });
            });
        }

        // Create an embed for the ban confirmation
        const embed = new EmbedBuilder()
            .setTitle('User Temporarily Banned')
            .setDescription(`**${target.tag}** has been temporarily banned for ${duration} minutes.`)
            .setColor('#FF0000')
            .setTimestamp();

        // Send the embed as a public message
        await interaction.reply({ embeds: [embed] });

        // Unban after the duration
        setTimeout(async () => {
            await guild.members.unban(target.id);
            const unbanEmbed = new EmbedBuilder()
                .setTitle('User Unbanned')
                .setDescription(`**${target.tag}** has been unbanned after ${duration} minutes.`)
                .setColor('#00FF00')
                .setTimestamp();

            // Send a public notification about unban
            await interaction.followUp({ embeds: [unbanEmbed] });
        }, duration * 60 * 1000);
    },
};
