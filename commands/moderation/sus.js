const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const connection = require('../../config/mysql'); // Import your MySQL connection

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sus')
        .setDescription('Add a suspicious note to a user (Staff only)')
        .addUserOption(option => option.setName('target').setDescription('The user to note').setRequired(true))
        .addStringOption(option => option.setName('note').setDescription('The note to add').setRequired(true)),

    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const noteContent = interaction.options.getString('note');
        const guildId = interaction.guild.id;

        if (!interaction.member.permissions.has('MANAGE_MESSAGES')) {
            return interaction.reply({ content: 'You don’t have permission to add notes.', ephemeral: true });
        }

        // Check if the note record already exists for the user
        const query = 'SELECT * FROM notes WHERE userId = ? AND guildId = ?';
        const values = [target.id, guildId];
        
        let noteRecord;

        // Fetch the note record from MySQL
        await new Promise((resolve, reject) => {
            connection.query(query, values, (err, results) => {
                if (err) {
                    console.error('Error fetching note record:', err);
                    return reject('An error occurred while fetching the note record.');
                }
                noteRecord = results[0] || null; // Grab the first result or null if not found
                resolve();
            });
        });

        if (!noteRecord) {
            // Insert new note record if it doesn't exist
            const insertQuery = 'INSERT INTO notes (userId, guildId, notes) VALUES (?, ?, ?)';
            const insertValues = [
                target.id,
                guildId,
                JSON.stringify([{ content: noteContent, author: interaction.user.tag, timestamp: new Date() }]) // Store as JSON
            ];

            await new Promise((resolve, reject) => {
                connection.query(insertQuery, insertValues, (err) => {
                    if (err) {
                        console.error('Error inserting new note record:', err);
                        return reject('An error occurred while adding the note.');
                    }
                    resolve();
                });
            });
        } else {
            // Update existing note record
            const updatedNotes = JSON.parse(noteRecord.notes);
            updatedNotes.push({ content: noteContent, author: interaction.user.tag, timestamp: new Date() });

            const updateQuery = 'UPDATE notes SET notes = ? WHERE userId = ? AND guildId = ?';
            const updateValues = [JSON.stringify(updatedNotes), target.id, guildId];

            await new Promise((resolve, reject) => {
                connection.query(updateQuery, updateValues, (err) => {
                    if (err) {
                        console.error('Error updating note record:', err);
                        return reject('An error occurred while updating the note.');
                    }
                    resolve();
                });
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('Note Added')
            .setDescription(`A note has been added to **${target.tag}**:\n${noteContent}`)
            .setColor('#FF0000')
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
