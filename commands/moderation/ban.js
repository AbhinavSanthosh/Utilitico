const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const connection = require('../../config/mysql'); // Import your MySQL connection

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bans a user')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false)),

    async execute(interactionOrMessage) {
        const target = interactionOrMessage.options?.getUser('target') || interactionOrMessage.message.mentions.users.first();
        const reason = interactionOrMessage.options?.getString('reason') || 'No reason provided';
        const guild = interactionOrMessage.guild;

        if (!target) {
            return interactionOrMessage.reply({ content: 'User not found!', ephemeral: true });
        }

        const member = guild.members.cache.get(target.id);
        if (!member) return interactionOrMessage.reply({ content: 'User not found in this guild!', ephemeral: true });

        // Create embed and buttons for confirmation
        const embed = new EmbedBuilder()
            .setTitle('Ban Confirmation')
            .setDescription(`Are you sure you want to ban **${target.tag}**?\n\n**Reason:** ${reason}`)
            .setColor('#FF0000')
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ban_confirm')
                    .setLabel('Confirm')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('ban_cancel')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary)
            );

        const message = await interactionOrMessage.reply({ embeds: [embed], components: [row] });

        const filter = i => i.user.id === interactionOrMessage.user.id;
        const collector = message.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async i => {
            if (i.customId === 'ban_confirm') {
                await member.ban({ reason });

                // Log the ban in MySQL
                const query = 'INSERT INTO history (userId, guildId, action, moderator, reason) VALUES (?, ?, ?, ?, ?)';
                const values = [target.id, guild.id, 'ban', interactionOrMessage.user.tag, reason];

                connection.query(query, values, (err, results) => {
                    if (err) {
                        console.error('Error logging ban in MySQL:', err);
                    } else {
                        console.log(`Ban logged for user: ${target.tag}`);
                    }
                });

                await interactionOrMessage.followUp({ content: `**${target.tag}** has been banned for: ${reason}`, ephemeral: false });
            } else if (i.customId === 'ban_cancel') {
                await i.update({ content: 'Ban canceled.', components: [], ephemeral: false });
            }
        });
    },
};
