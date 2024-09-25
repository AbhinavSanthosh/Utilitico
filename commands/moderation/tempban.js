const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const History = require('../../models/history'); // Import your History model

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

        // Check if history exists in MongoDB
        let history = await History.findOne({ userId: target.id, guildId: guild.id });

        if (!history) {
            // Insert new history record if it doesn't exist
            history = new History({
                userId: target.id,
                guildId: guild.id,
                actions: [{ action: `tempban (${duration} minutes)`, moderator: interaction.user.tag }]
            });
        } else {
            // Update existing history record
            history.actions.push({ action: `tempban (${duration} minutes)`, moderator: interaction.user.tag });
        }

        // Save the history record to MongoDB
        await history.save();

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
