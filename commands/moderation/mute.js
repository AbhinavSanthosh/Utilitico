const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const connection = require('../../config/mysql'); // Import your MySQL connection

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mutes a user')
        .addUserOption(option => option.setName('target').setDescription('The user to mute').setRequired(true))
        .addStringOption(option => option.setName('duration').setDescription('Duration of the mute (e.g., 10m, 1h, 1d)').setRequired(false)),

    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const duration = interaction.options.getString('duration');
        const guild = interaction.guild;
        const muteRole = guild.roles.cache.find(role => role.name.toLowerCase() === 'muted');

        if (!muteRole) {
            return interaction.reply({ content: 'Mute role not found. Please create a role named "Muted".', ephemeral: true });
        }

        const member = guild.members.cache.get(target.id);
        if (!member) return interaction.reply({ content: 'User not found in this guild!', ephemeral: true });

        if (member.roles.cache.has(muteRole.id)) {
            return interaction.reply({ content: 'User is already muted.', ephemeral: true });
        }

        // Add the mute role to the member
        await member.roles.add(muteRole);

        // Record mute history in MySQL
        const query = 'INSERT INTO history (userId, guildId, action, moderator, timestamp) VALUES (?, ?, ?, ?, ?)';
        const values = [
            target.id,
            guild.id,
            `mute ${duration ? `for ${duration}` : 'indefinitely'}`,
            interaction.user.tag,
            new Date()
        ];

        await new Promise((resolve, reject) => {
            connection.query(query, values, (err) => {
                if (err) {
                    console.error('Error saving mute history:', err);
                    return reject('An error occurred while saving mute history.');
                }
                resolve();
            });
        });

        // Create an embed for the mute confirmation
        const embed = new EmbedBuilder()
            .setTitle('User Muted')
            .setDescription(`**${target.tag}** has been muted ${duration ? `for ${duration}` : 'indefinitely'}.`)
            .setColor('#FF0000')
            .setTimestamp();

        // Send the embed as a public message
        await interaction.reply({ embeds: [embed] });

        // Handle temporary mute
        if (duration) {
            const ms = require('ms');
            const muteDuration = ms(duration);
            if (!muteDuration) return;

            setTimeout(async () => {
                if (member.roles.cache.has(muteRole.id)) {
                    await member.roles.remove(muteRole);
                }
            }, muteDuration);
        }
    },
};
