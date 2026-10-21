const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder,
  PermissionsBitField,
  ChannelType, 
  PermissionFlagsBits 
} = require('discord.js');
const express = require('express');
const axios = require('axios');

// ==========================================
// 1. EXPRESS VEB SERVER VƏ ESTETİK SAYT
// ==========================================
const app = express();
const PORT = process.env.PORT || 3000;

// Logların saxlanılması üçün massiv
const botLogs = [];

function addLog(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  botLogs.unshift({ timestamp, type, message });
  if (botLogs.length > 50) botLogs.pop(); // Son 50 logu saxlayırıq
  console.log(`[${type}] ${timestamp} - ${message}`);
}

// Estetik Dashboard / Sayt
app.get('/', (req, res) => {
  const logRows = botLogs.map(log => {
    let color = '#3b82f6';
    if (log.type === 'WARN') color = '#f59e0b';
    if (log.type === 'ERROR') color = '#ef4444';
    return `<div style="padding: 8px; border-bottom: 1px solid #1e293b; font-family: monospace; font-size: 13px;">
      <span style="color: #64748b;">[${log.timestamp.split('T')[1].split('.')[0]}]</span> 
      <span style="color: ${color}; font-weight: bold;">[${log.type}]</span> 
      <span style="color: #e2e8f0;">${log.message}</span>
    </div>`;
  }).join('') || '<div style="color: #64748b; padding: 10px;">Hələ heç bir log yoxdur...</div>';

  const html = `
  <!DOCTYPE html>
  <html lang="az">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pro Discord Bot Dashboard</title>
    <style>
      body { background-color: #0f172a; color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; }
      .container { max-width: 900px; margin: 0 auto; }
      .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1e293b; padding-bottom: 20px; margin-bottom: 20px; }
      .status { background: #10b981; color: #fff; padding: 6px 12px; border-radius: 20px; font-weight: bold; font-size: 14px; }
      .card { background: #1e293b; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-bottom: 20px; }
      .logs-container { background: #020617; border-radius: 8px; height: 350px; overflow-y: auto; border: 1px solid #1e293b; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Discord Bot Dashboard</h1>
        <span class="status">● Sistem Aktivdir</span>
      </div>
      <div class="card">
        <h3>Sistem Statusu</h3>
        <p>Bot Render serverlərində uğurla çalışır və sorğuları qəbul edir.</p>
      </div>
      <div class="card">
        <h3>Konsol / Sistem Logları</h3>
        <div class="logs-container">
          ${logRows}
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
  res.send(html);
});

app.listen(PORT, () => {
  addLog(`Veb Server ${PORT} portunda işə düşdü.`, 'INFO');
});

// ==========================================
// 2. DISCORD BOT KODU
// ==========================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.once('ready', () => {
  addLog(`Bot uğurla daxil oldu: ${client.user.tag}`, 'INFO');
  
  // Əmrlərin (Slash Commands) qeydiyyatdan keçirilməsi
  const commands = [
    {
      name: 'kömək',
      description: 'Bütün əmrləri və menyunu göstərir'
    },
    {
      name: 'ping',
      description: 'Botun gecikmə (ping) müddətini göstərir'
    },
    {
      name: 'insta',
      description: 'İnstagram hesabı haqqında məlumatı göstərir',
      options: [{
        name: 'istifadəçi',
        type: 3, // STRING
        description: 'İnstagram istifadəçi adı',
        required: true
      }]
    },
    {
      name: 'userinfo',
      description: 'Etiketlənən istifadəçi haqqında məlumat verir',
      options: [{
        name: 'istifadəçi',
        type: 6, // USER
        description: 'Məlumatı alınacaq istifadəçi',
        required: false
      }]
    },
    {
      name: 'serverinfo',
      description: 'Server haqqında ətraflı məlumat göstərir'
    },
    {
      name: 'sil',
      description: 'Müəyyən sayda mesajı silir',
      options: [{
        name: 'say',
        type: 4, // INTEGER
        description: 'Silinəcək mesaj sayı (1-100)',
        required: true
      }]
    },
    {
      name: 'ban',
      description: 'İstifadəçini serverdən kənarlaşdırır',
      options: [
        { name: 'istifadəçi', type: 6, description: 'Cəzalandırılacaq şəxs', required: true },
        { name: 'səbəb', type: 3, description: 'Ban səbəbi', required: false }
      ]
    },
    {
      name: 'kick',
      description: 'İstifadəçini serverdən çıxarır',
      options: [
        { name: 'istifadəçi', type: 6, description: 'Çıxarılacaq şəxs', required: true },
        { name: 'səbəb', type: 3, description: 'Çıxarılma səbəbi', required: false }
      ]
    }
  ];

  client.application.commands.set(commands);
  addLog('Slash əmrləri uğurla yeniləndi.', 'INFO');
});

// Interaksiya Paneli (Slash Commands & Interaktiv Düymələr)
client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction;

      // PİNG ƏMRİ
      if (commandName === 'ping') {
        const ping = client.ws.ping;
        await interaction.reply({ content: `Pong! 🏓 Gecikmə müddəti: **${ping}ms**`, ephemeral: true });
        addLog(`${interaction.user.tag} /ping əmrini işlətdi.`, 'INFO');
      }

      // KÖMƏK ƏMRİ
      if (commandName === 'kömək') {
        const embed = new EmbedBuilder()
          .setTitle('✨ Botun İdarəetmə və Kömək Paneli')
          .setDescription('Aşağıdakı menyudan istədiyiniz kateqoriyanı seçərək əmrlər haqqında ətraflı məlumat ala bilərsiniz.')
          .setColor('#5865F2')
          .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('help_menu')
          .setPlaceholder('Kateqoriya seçin...')
          .addOptions([
            { label: 'Moderasiya Əmrləri', description: 'Serveri idarə etmək üçün əmrlər', value: 'mod_cmds' },
            { label: 'İnformasiya Əmrləri', description: 'İnstagram və digər sorğular', value: 'info_cmds' }
          ]);

        const button = new ButtonBuilder()
          .setLabel('Dəstək Serveri / Sayt')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://dc-h62r.onrender.com/`);

        const row1 = new ActionRowBuilder().addComponents(selectMenu);
        const row2 = new ActionRowBuilder().addComponents(button);

        await interaction.reply({ embeds: [embed], components: [row1, row2] });
        addLog(`${interaction.user.tag} /kömək əmrini işlətdi.`, 'INFO');
      }

      // INSTAGRAM ƏMRİ
      if (commandName === 'insta') {
        const username = interaction.options.getString('istifadəçi');
        
        const embed = new EmbedBuilder()
          .setTitle(`📸 Instagram Profili: @${username}`)
          .setDescription(`İstifadəçi adı: **${username}**\n\nBu hesab haqqında ümumi məlumatları rəsmi Instagram platformasından yoxlaya bilərsiniz.`)
          .setColor('#E1306C')
          .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png')
          .setFooter({ text: 'Rəsmi Açıq Məlumat Sorğusu' })
          .setTimestamp();

        const button = new ButtonBuilder()
          .setLabel('Profili Aç (Instagram)')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://www.instagram.com/${username}/`);

        const row = new ActionRowBuilder().addComponents(button);

        await interaction.reply({ embeds: [embed], components: [row] });
        addLog(`${interaction.user.tag} /insta @${username} sorğusu etdi.`, 'INFO');
      }

      // USERİNFO ƏMRİ
      if (commandName === 'userinfo') {
        const target = interaction.options.getUser('istifadəçi') || interaction.user;
        const member = interaction.guild.members.cache.get(target.id);

        const embed = new EmbedBuilder()
          .setTitle(`👤 İstifadəçi Məlumatı: ${target.tag}`)
          .setThumbnail(target.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: 'İD', value: target.id, inline: true },
            { name: 'Qoşulma Tarixi', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
            { name: 'Hesab Yaradılma', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true }
          )
          .setColor('#5865F2');

        await interaction.reply({ embeds: [embed] });
      }

      // SERVERİNFO ƏMRİ
      if (commandName === 'serverinfo') {
        const guild = interaction.guild;
        const embed = new EmbedBuilder()
          .setTitle(`📊 Server Məlumatı: ${guild.name}`)
          .setThumbnail(guild.iconURL({ dynamic: true }))
          .addFields(
            { name: 'Sahib', value: `<@${guild.ownerId}>`, inline: true },
            { name: 'Üzv Sayı', value: `${guild.memberCount}`, inline: true },
            { name: 'Yaradılma Tarixi', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true }
          )
          .setColor('#3b82f6');

        await interaction.reply({ embeds: [embed] });
      }

      // MODERASİYA: SIL
      if (commandName === 'sil') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
          return interaction.reply({ content: '❌ Bu əmri istifadə etmək üçün `Mesajları İdarə Et` icazəniz yoxdur.', ephemeral: true });
        }

        const count = interaction.options.getInteger('say');
        if (count < 1 || count > 100) {
          return interaction.reply({ content: '❌ Zəhmət olmasa 1 ilə 100 arasında bir rəqəm yazın.', ephemeral: true });
        }

        await interaction.channel.bulkDelete(count, true);
        
        const embed = new EmbedBuilder()
          .setTitle('🧹 Mesajlar Təmizləndi')
          .setDescription(`Uğurla **${count}** ədəd mesaj silindi.`)
          .setColor('#57F287');

        await interaction.reply({ embeds: [embed], ephemeral: true });
        addLog(`${interaction.user.tag} kanaldan ${count} mesaj sildi.`, 'WARN');
      }

      // MODERASİYA: BAN
      if (commandName === 'ban') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
          return interaction.reply({ content: '❌ Bu əmri istifadə etmək üçün `Üzvləri Ban Et` icazəniz yoxdur.', ephemeral: true });
        }

        const target = interaction.options.getUser('istifadəçi');
        const reason = interaction.options.getString('səbəb') || 'Səbəb göstərilməyib';

        await interaction.guild.members.ban(target, { reason });

        const embed = new EmbedBuilder()
          .setTitle('🔨 İstifadəçi Ban Olundu')
          .addFields(
            { name: 'İstifadəçi', value: `${target.tag}`, inline: true },
            { name: 'Səbəb', value: reason, inline: true }
          )
          .setColor('#ED4245');

        await interaction.reply({ embeds: [embed] });
        addLog(`${target.tag} istifadəçisi ${interaction.user.tag} tərəfindən ban olundu.`, 'WARN');
      }

      // MODERASİYA: KICK
      if (commandName === 'kick') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
          return interaction.reply({ content: '❌ Bu əmri istifadə etmək üçün `Üzvləri At` icazəniz yoxdur.', ephemeral: true });
        }

        const target = interaction.options.getUser('istifadəçi');
        const reason = interaction.options.getString('səbəb') || 'Səbəb göstərilməyib';
        const member = interaction.guild.members.cache.get(target.id);

        await member.kick(reason);

        const embed = new EmbedBuilder()
          .setTitle('👢 İstifadəçi Serverdən Çıxarıldı')
          .addFields(
            { name: 'İstifadəçi', value: `${target.tag}`, inline: true },
            { name: 'Səbəb', value: reason, inline: true }
          )
          .setColor('#FEE75C');

        await interaction.reply({ embeds: [embed] });
        addLog(`${target.tag} istifadəçisi ${interaction.user.tag} tərəfindən kick olundu.`, 'WARN');
      }
    }

    // SELECT MENU QARŞILIĞI (Kömək menyusu)
    if (interaction.isStringSelectMenu() && interaction.customId === 'help_menu') {
      const selected = interaction.values[0];

      if (selected === 'mod_cmds') {
        const modEmbed = new EmbedBuilder()
          .setTitle('🛡️ Moderasiya Əmrləri')
          .setDescription('• `/sil [say]` - Mesajları kütləvi silir.\n• `/ban [istifadəçi] [səbəb]` - İstifadəçini qadağan edir.\n• `/kick [istifadəçi] [səbəb]` - İstifadəçini serverdən çıxarır.')
          .setColor('#FEE75C');
        await interaction.update({ embeds: [modEmbed] });
      } else if (selected === 'info_cmds') {
        const infoEmbed = new EmbedBuilder()
          .setTitle('ℹ️ İnformasiya Əmrləri')
          .setDescription('• `/kömək` - Kömək menyusunu açır.\n• `/insta [istifadəçi]` - İnstagram profil linkini verir.\n• `/ping` - Botun gecikmə sürətini yoxlayır.\n• `/userinfo` - İstifadəçi məlumatlarını göstərir.\n• `/serverinfo` - Server məlumatlarını göstərir.')
          .setColor('#5865F2');
        await interaction.update({ embeds: [infoEmbed] });
      }
    }

    // TICKET (DƏSTƏK) MENYU SEÇİMİ
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
      const guild = interaction.guild;
      const categoryValue = interaction.values[0];

      const existingChannel = guild.channels.cache.find(c => c.name === `ticket-${interaction.user.username.toLowerCase()}`);
      if (existingChannel) {
        return interaction.reply({ content: `Sizin artıq açıq biletiniz var: ${existingChannel}`, ephemeral: true });
      }

      const ticketChannel = await guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          },
        ],
      });

      const ticketEmbed = new EmbedBuilder()
        .setTitle(`🎫 Dəstək Bileti - ${categoryValue.toUpperCase()}`)
        .setDescription(`Xoş gəldiniz ${interaction.user}! Zəhmət olmasa probleminizi ətraflı yazın. Yetkililər qısa zamanda cavab verəcək.`)
        .setColor(0x2ecc71);

      const closeButton = new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Ticket-i Bağla')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒');

      const row = new ActionRowBuilder().addComponents(closeButton);

      await ticketChannel.send({ content: `${interaction.user}`, embeds: [ticketEmbed], components: [row] });
      await interaction.reply({ content: `Dəstək kanalınız yaradıldı: ${ticketChannel}`, ephemeral: true });
    }

    // TICKET BAĞLAMA DÜYMƏSİ
    if (interaction.isButton() && interaction.customId === 'close_ticket') {
      await interaction.reply({ content: 'Bu bilet 5 saniyə sonra bağlanır və silinir...' });
      
      setTimeout(() => {
        interaction.channel.delete().catch(console.error);
      }, 5000);
    }

  } catch (err) {
    addLog(`Xəta baş verdi: ${err.message}`, 'ERROR');
  }
});

// Mesaj hadisələri
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Salam cavabı (salam)
  if (message.content.toLowerCase() === '+salam') {
    await message.reply(`Aleykum salam, ${message.author}! Serverimizə xoş gəldin! 👋`);
  }

  // Dəstək əmri (/dəstək və ya !dəstək)
  if (message.content.toLowerCase() === '/dəstək' || message.content.toLowerCase() === '!dəstək') {
    const embed = new EmbedBuilder()
      .setTitle('🛠️ Dəstək Mərkəzi')
      .setDescription('Kömək almaq üçün aşağıdakı menyudan sizə uyğun olan mövzunu seçin.')
      .setColor(0x3498db)
      .setFooter({ text: 'Dəstək Sistemi' });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('ticket_select')
      .setPlaceholder('Mövzu seçin...')
      .addOptions([
        { label: 'Texniki Problem', description: 'Bot və ya serverlə bağlı texniki problem', value: 'tech', emoji: '⚙️' },
        { label: 'Şikayət və Təklif', description: 'Təklifləriniz və ya şikayətləriniz', value: 'suggest', emoji: '📩' },
        { label: 'Ümumi Sual', description: 'Digər suallarınız üçün', value: 'general', emoji: '❓' }
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await message.channel.send({ embeds: [embed], components: [row] });
  }
});

//Salam yayım 
const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder,
  PermissionsBitField,
  ChannelType, 
  PermissionFlagsBits  
} = require('discord.js');

const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  AudioPlayerStatus 
} = require('@discordjs/voice');

// Botun yaradılması və lazım olan intents-lər
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates, // Səs kanalları üçün vacibdir
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Yayım üçün video/musiqi linkiniz
const VIDEO_LINK = "https://youtu.be/3ojXHf293M8?si=ivoaxlMyYGxdbR-H"; 

client.on('ready', () => {
  console.log(`Bot uğurla işə düşdü: ${client.user.tag}`);
});

// Mesaj yazıldıqda `#kanal` adını yoxlayıb qoşulma hissəsi
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  // Mesajda hər hansı səs kanalının qeyd olunduğunu yoxlayırıq
  const voiceChannel = message.mentions.channels.find(channel => channel.type === ChannelType.GuildVoice);

  if (voiceChannel) {
    try {
      // Səs kanalına qoşulma
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
      });

      message.reply(`✅ Uğurla **${voiceChannel.name}** səs kanalına qoşuldum və yayım başladı!`);

      // Səs axınını/videonu oxutmaq
      const player = createAudioPlayer();
      const resource = createAudioResource(VIDEO_LINK);

      connection.subscribe(player);
      player.play(resource);

    } catch (error) {
      console.error(error);
      message.reply('❌ Kanala qoşularkən xəta baş verdi!');
    }
  }
});



// Bot Tokeni ilə giriş
const TOKEN = process.env.DISCORD_TOKEN;
if (TOKEN) {
  client.login(TOKEN);
} else {
  addLog('DISCORD_TOKEN mühit dəyişəni tapılmadı!', 'ERROR');
                                            }
  
