const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require('discord.js');
const { request } = require('undici');
const { hackTheBoxApiToken } = require('../../config.json');

// build embed to show results
function buildResultsEmbed(machines, page, hackTheBoxUrl, hackTheBoxLabsUrl, sort, order) {
    const resultsEmbed = new EmbedBuilder()
    .setColor(0x9fef00)
    .setAuthor({ name: "HackTheBox", iconURL: "https://static-00.iconduck.com/assets.00/hack-the-box-icon-512x512-pokr8xc5.png", url: "https://app.hackthebox.com/"})
    .setTitle("Retired Machines")
    .setFooter({ text: `Page ${page}` });

    if(sort) {
        resultsEmbed.setTitle(`Retired Machines (${sort}, ${order})`)
    }
    if(machines.length > 0) {
        resultsEmbed.setThumbnail(`${hackTheBoxLabsUrl}/${machines[0]['avatar']}`);
        machines.forEach(machine => {
            const { name, difficulty, difficultyText, star } = machine;
            const machineUrl = `${hackTheBoxUrl}/machines/${name}`;
    
            resultsEmbed.addFields({
                name,
                value: `${difficultyText} (${difficulty}) | Rating: ${star} | [View Machine](${machineUrl})`
            });
        });
    } else {
        resultsEmbed.addFields({
            name: "No results",
            value: "There are no results for the requested page"
        });
    }

    return resultsEmbed;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('retired')
        .setDescription('View retired HackTheBox machine details!')
        .addStringOption(option => 
            option.setName('sort')
                .setDescription('Data to sort by: ')
                .addChoices(
                    { name: 'rating', value: 'rating' },
                    { name: 'name', value: 'name' },
                    { name: 'user-owns', value: 'user-owns' },
                    { name: 'system-owns', value: 'user-owns' },
                    { name: 'user-difficulty', value: 'user-difficulty' },
                    { name: 'released', value: 'release-date' }
                ))
        .addStringOption(option => 
            option.setName('order')
                .setDescription('Direction to sort in: ascending, descending')
                .addChoices(
                    { name: 'ascending', value: 'asc' },
                    { name: 'descending', value: 'desc' }
                ))
        .addIntegerOption(option => 
            option.setName('page')
                .setDescription('Page number for results')),
    async execute(interaction) {
        try {
            await interaction.deferReply();

            // get command arguments
            const sort = interaction.options.getString('sort');
            const order = interaction.options.getString('order') || 'desc';
            let page = interaction.options.getInteger('page') || 1;

            // set up api URLs
            const apiUrlRoot = 'https://www.hackthebox.com/api/v4';
            let apiUrlContext = 'machine/list/retired/paginated'
            let apiUrlQueries = `?page=${page}`;
            if (sort) {
                apiUrlQueries += `&sort_by=${sort}&sort_type=${order}`;
            }
            const apiUrlFull = `${apiUrlRoot}/${apiUrlContext}${apiUrlQueries}`;
            const apiHeaders = { Authorization: `Bearer ${hackTheBoxApiToken}` };
            const hackTheBoxUrl = 'https://app.hackthebox.com';
            const hackTheBoxLabsUrl = 'https://labs.hackthebox.com';

            // make request
            const response = await request(apiUrlFull, { headers: apiHeaders });
            const responseBody = await response.body.json();

            // parse response data
            const machines = responseBody.data;
            
            // create embed for result display
            const searchEmbed = buildResultsEmbed(machines, page, hackTheBoxUrl, hackTheBoxLabsUrl, sort, order);

            // configure pagination buttons
            const previousButton = new ButtonBuilder()
                .setCustomId('previous_page')
                .setLabel('Previous Page')
                .setStyle('Primary');
            const nextButton = new ButtonBuilder()
                .setCustomId('next_page')
                .setLabel('Next Page')
                .setStyle('Primary');
            const actionRow = new ActionRowBuilder().addComponents(previousButton, nextButton);

            // send response
            await interaction.editReply({ embeds: [searchEmbed], components: [actionRow.toJSON()] });

            // set up collectors for pagination buttons
            const collectorFilter = i => (i.customId === 'next_page' || i.customId === 'previous_page') && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter: collectorFilter, time: 15000 });
            collector.on('collect', async interaction => {
                try {
                    if (interaction.customId === 'next_page') {
                        page++;
                    } else if (interaction.customId === 'previous_page' && page > 1) {
                        page--;
                    }
                    apiUrlQueries = `?page=${page}`;
                    if (sort) {
                        apiUrlQueries += `&sort_by=${sort}&sort_type=${order}`;
                    }

                    const nextApiUrlFull = `${apiUrlRoot}/${apiUrlContext}${apiUrlQueries}`;
                    const nextResponse = await request(nextApiUrlFull, { headers: apiHeaders });
                    const nextResponseBody = await nextResponse.body.json();
                    const machines = nextResponseBody.data;

                    const searchEmbed = buildResultsEmbed(machines, page, hackTheBoxUrl, hackTheBoxLabsUrl, sort, order)

                    await interaction.update({ embeds: [searchEmbed], components: [actionRow.toJSON()] });
                    // collector.stop();
                } catch (error) {
                    console.error('Error while processing button click:', error);
                    await interaction.followUp('There was an error processing your request.');
                }
            });
            collector.on('end', () => {
                console.log('Collector ended.');
            });

        } catch (error) {
            console.error('Error fetching CTF events:', error);
            await interaction.editReply('There was an error fetching machines.');
        }
    },
};
