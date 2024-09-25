const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Notes = require('../../models/note'); // Import your Notes model

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

        // Check for the necessary permissions
        if (!interaction.member.permissions.has('MANAGE_MESSAGES')) {
            return interaction.reply({ content: 'You don’t have permission to add notes.', ephemeral: true });
        }

        // Check if a note record already exists for the user
        let noteRecord = await Notes.findOne({ userId: target.id, guildId });

        if (!noteRecord) {
            // If no record exists, create a new one
            noteRecord = new Notes({
                userId: target.id,
                guildId,
                notes: [{ content: noteContent, author: interaction.user.tag, timestamp: new Date() }]
            });
        } else {
            // If a record exists, update it by pushing the new note
            noteRecord.notes.push({ content: noteContent, author: interaction.user.tag, timestamp: new Date() });
        }

        // Save the note record to the database
        await noteRecord.save();

        // Create an embed for confirmation
        const embed = new EmbedBuilder()
            .setTitle('Note Added')
            .setDescription(`A note has been added to **${target.tag}**:\n${noteContent}`)
            .setColor('#FF0000')
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
