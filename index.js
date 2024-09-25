const { Client, GatewayIntentBits, Collection } = require('discord.js');
const mongoose = require('mongoose'); // Import mongoose for MongoDB
const fs = require('fs');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ],
});

client.commands = new Collection();
const commandFolders = fs.readdirSync('./commands');

// Load commands
for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./commands/${folder}/${file}`);
        client.commands.set(command.data.name, command);
    }
}

// Connect to MongoDB
(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit the process if unable to connect
    }
})();

// Event: Bot is ready
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// Prefix-based command handling
const prefix = process.env.PREFIX || '!';

client.on('messageCreate', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        await command.execute({ message, args });
    } catch (error) {
        console.error('Error executing command:', error);
        message.reply({ content: 'There was an error executing that command.', ephemeral: true });
    }
});

// Slash command handling
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('Error executing slash command:', error);
        await interaction.reply({ content: 'There was an error executing that command!', ephemeral: true });
    }
});

// Logging DB connection details (optional, sensitive info)
console.log('MONGO_URI:', process.env.MONGO_URI);

client.login(process.env.DISCORD_TOKEN);
