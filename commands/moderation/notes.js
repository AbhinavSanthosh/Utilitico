const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const connection = require('../../config/mysql'); // Import your MySQL connection

module.exports = {
    data: new SlashCommandBuilder()
        .setName('notes')
        .setDescription('View or remove notes from a user')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View notes of a user')
                .addUserOption(option => option.setName('target').setDescription('The user to view notes for').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a specific note by its index')
                .addUserOption(option => option.setName('target').setDescription('The user whose note to remove').setRequired(true))
                .addIntegerOption(option => option.setName('index').setDescription('Index of the note to remove').setRequired(true))
        ),

    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const guildId = interaction.guild.id;
        const subcommand = interaction.options.getSubcommand();

        if (!interaction.member.permissions.has('MANAGE_MESSAGES')) {
            return interaction.reply({ content: 'You don’t have permission to manage notes.', ephemeral: true });
        }

        // Fetch notes from MySQL
        const query = 'SELECT * FROM notes WHERE userId = ? AND guildId = ?';
        const values = [target.id, guildId];

        const noteRecord = await new Promise((resolve, reject) => {
            connection.query(query, values, (err, results) => {
                if (err) {
                    console.error('Error fetching notes:', err);
                    return reject('An error occurred while fetching notes.');
                }
                resolve(results[0]); // Get the first record if it exists
            });
        });

        if (!noteRecord || !noteRecord.notes) {
            return interaction.reply({ content: `No notes found for **${target.tag}**.`, ephemeral: true });
        }

        if (subcommand === 'view') {
            const notes = JSON.parse(noteRecord.notes || '[]'); // Assuming notes are stored as a JSON string
            const embed = new EmbedBuilder()
                .setTitle(`Notes for ${target.tag}`)
                .setDescription(notes.map((note, index) => `${index + 1}. ${note.content} (by ${note.author} at ${new Date(note.timestamp).toLocaleString()})`).join('\n') || 'No notes available.')
                .setColor('#FF0000')
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else if (subcommand === 'remove') {
            const index = interaction.options.getInteger('index') - 1;
            const notes = JSON.parse(noteRecord.notes || '[]');

            if (index < 0 || index >= notes.length) {
                return interaction.reply({ content: 'Invalid note index.', ephemeral: true });
            }

            notes.splice(index, 1); // Remove the note
            const updatedNotes = JSON.stringify(notes);

            // Update the notes in MySQL
            const updateQuery = 'UPDATE notes SET notes = ? WHERE userId = ? AND guildId = ?';
            const updateValues = [updatedNotes, target.id, guildId];

            await new Promise((resolve, reject) => {
                connection.query(updateQuery, updateValues, (updateErr) => {
                    if (updateErr) {
                        console.error('Error updating notes:', updateErr);
                        return reject('An error occurred while updating notes.');
                    }
                    resolve();
                });
            });

            await interaction.reply({ content: `Note removed successfully from **${target.tag}**.`, ephemeral: true });
        }
    },
};
