const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Note = require('../../models/note'); // Import your MongoDB Note model

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

        // Fetch notes from MongoDB
        const noteRecord = await Note.findOne({ userId: target.id, guildId });

        if (!noteRecord || noteRecord.notes.length === 0) {
            return interaction.reply({ content: `No notes found for **${target.tag}**.`, ephemeral: true });
        }

        if (subcommand === 'view') {
            const embed = new EmbedBuilder()
                .setTitle(`Notes for ${target.tag}`)
                .setDescription(noteRecord.notes.map((note, index) => 
                    `${index + 1}. ${note.content} (by ${note.author} at ${new Date(note.timestamp).toLocaleString()})`
                ).join('\n') || 'No notes available.')
                .setColor('#FF0000')
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else if (subcommand === 'remove') {
            const index = interaction.options.getInteger('index') - 1;

            if (index < 0 || index >= noteRecord.notes.length) {
                return interaction.reply({ content: 'Invalid note index.', ephemeral: true });
            }

            // Remove the note
            noteRecord.notes.splice(index, 1);
            await noteRecord.save(); // Save updated document in MongoDB

            await interaction.reply({ content: `Note removed successfully from **${target.tag}**.`, ephemeral: true });
        }
    },
};
