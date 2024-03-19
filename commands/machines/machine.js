const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require('discord.js');
const { request } = require('undici');
const { hackTheBoxApiToken } = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('machine')
        .setDescription('View specific HackTheBox machine details!')
        .addStringOption(option => 
            option.setName('machinename')
                .setDescription('Name of machine to look up')),
    async execute(interaction) {
        try {
            await interaction.deferReply();

            const machineName = interaction.options.getString('machinename') || 'all';

            const apiUrlRoot = 'https://www.hackthebox.com/api/v4';
            let apiUrlContext = `machine/profile`;

            const apiUrlFull = `${apiUrlRoot}/${apiUrlContext}/${machineName}`;
            const apiHeaders = { Authorization: `Bearer ${hackTheBoxApiToken}` };
            const hackTheBoxUrl = 'https://app.hackthebox.com';
            const hackTheBoxLabsUrl = 'https://labs.hackthebox.com';

            const response = await request(apiUrlFull, { headers: apiHeaders });
            const responseBody = await response.body.json();
            
            const { info } = responseBody;
            const { name, difficulty, difficultyText, os, retired, avatar, maker, synopsis, stars, reviews_count, release, user_owns_count, root_owns_count } = info;
            const machineRetired = retired ? 'Yes' : 'No';
            const machineUrl = `${hackTheBoxUrl}/machines/${name}`;
            const machineImage = `${hackTheBoxLabsUrl}/${avatar}`;
            const machineMakerName = maker.name;
            const machineMakerAvatar = `${hackTheBoxLabsUrl}/${maker.avatar}`;
            const machineMakerUrl =`${hackTheBoxUrl}/users/${maker.id}`;

            const machineEmbed = new EmbedBuilder()
                .setColor(0x9fef00)
                .setTitle(name)
                .setURL(machineUrl)
                .setAuthor({ name: machineMakerName, iconURL: machineMakerAvatar, url: machineMakerUrl})
                .setThumbnail(machineImage)
                .setDescription(synopsis)
                .addFields(
                    { name: "OS", value: os, inline: true },
                    { name: "Difficulty", value: `${difficultyText} (${difficulty})`, inline: true },
                    { name: "Retired", value: machineRetired, inline: true },
                    { name: "Rating", value: `${stars} (${reviews_count} reviews)`, inline: true },
                    { name: "Released", value: `${release}`, inline: true },
                    { name: "User Owns", value: `${user_owns_count}`, inline: true },
                    { name: "Root Owns", value: `${root_owns_count}`, inline: true }
                );

            await interaction.editReply({ embeds: [machineEmbed]});
            
        } catch (error) {
            console.error('Error fetching CTF events:', error);
            await interaction.editReply('There was an error fetching machines.');
        }
    },
};
