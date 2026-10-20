const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder,
  PermissionsBitField
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
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  addLog(`Bot uğurla daxil oldu: ${client.user.tag}`, 'INFO');
  
  // Əmrləri (Slash Commands) qeydiyyatdan keçirmək
  const commands = [
    {
      name: 'kömək',
      description: 'Bütün əmrləri və menyunu göstərir'
    },
    {
      name: 'insta',
      description: 'İnstagram hesabı haqqında rəsmi məlumatı göstərir',
      options: [{
        name: 'istifadəçi',
        type: 3, // STRING
        description: 'İnstagram istifadəçi adı',
        required: true
      }]
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
    }

    // SELECT MENU QARŞILIĞI
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'help_menu') {
        const selected = interaction.values[0];

        if (selected === 'mod_cmds') {
          const modEmbed = new EmbedBuilder()
            .setTitle('🛡️ Moderasiya Əmrləri')
            .setDescription('• `/sil [say]` - Mesajları kütləvi silir.\n• `/ban [istifadəçi] [səbəb]` - Istifadəçini qadağan edir.\n• `/kick [istifadəçi] [səbəb]` - İstifadəçini serverdən çıxarır.')
            .setColor('#FEE75C');
          await interaction.update({ embeds: [modEmbed] });
        } else if (selected === 'info_cmds') {
          const infoEmbed = new EmbedBuilder()
            .setTitle('ℹ️ İnformasiya Əmrləri')
            .setDescription('• `/kömək` - Kömək menyusunu açır.\n• `/insta [istifadəçi]` - İnstagram profil linkini və məlumatını verir.')
            .setColor('#5865F2');
          await interaction.update({ embeds: [infoEmbed] });
        }
      }
    }
  } catch (err) {
    addLog(`Xəta baş verdi: ${err.message}`, 'ERROR');
  }
});

//🤖 robot
client.on('messageCreate', async (message) => {
    // Botun öz mesajlarına və ya digər botlara reaksiya verməməsi üçün:
    if (message.author.bot) return;

    try {
        // Mesaja 🤖 reaksiyası əlavə edir
        await message.react('🤖');

        // Mesajı yazan şəxsin DM-inə "BOT" yazır
        await message.author.send('BOT');
    } catch (error) {
        console.error('DM göndərilərkən və ya reaksiya qoyularkən xəta yarandı:', error);
    }
});

//Mesaj
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Yalnız "+Salam" və ya "+salam" yazıldıqda işləyir
    if (message.content.toLowerCase() === '+salam') {
        await message.reply(`Aleykum salam, ${message.author}! Serverimizə xoş gəldin! 👋`);
    }
});


// Bot Tokeni ilə giriş
const TOKEN = process.env.DISCORD_TOKEN;
if (TOKEN) {
  client.login(TOKEN);
} else {
  addLog('DISCORD_TOKEN mühit dəyişəni (Environment Variable) tapılmadı!', 'ERROR');
}
