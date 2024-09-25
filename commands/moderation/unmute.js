const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const History = require('../../models/history'); // MongoDB model for history

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Unmutes a user')
        .addUserOption(option => option.setName('target').setDescription('The user to unmute').setRequired(true)),

    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const guild = interaction.guild;

        const member = guild.members.cache.get(target.id);
        if (!member) {
            return interaction.reply({ content: 'User not found in this guild!', ephemeral: true });
        }

        const muteRole = guild.roles.cache.find(role => role.name.toLowerCase() === 'muted');
        if (!muteRole) {
            return interaction.reply({ content: 'Mute role not found. Please create a role named "Muted".', ephemeral: true });
        }

        if (!member.roles.cache.has(muteRole.id)) {
            return interaction.reply({ content: 'User is not muted.', ephemeral: true });
        }

        // Remove mute role
        await member.roles.remove(muteRole);

        // Log the action in MongoDB
        let history = await History.findOne({ userId: target.id, guildId: guild.id });
        if (!history) {
            history = new History({ userId: target.id, guildId: guild.id, actions: [] });
        }
        history.actions.push({ action: 'unmute', moderator: interaction.user.tag, timestamp: new Date() });
        await history.save();

        // Create and send the embed
        const embed = new EmbedBuilder()
            .setTitle('User Unmuted')
            .setDescription(`**${target.tag}** has been unmuted.`)
            .setColor('#008000')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
