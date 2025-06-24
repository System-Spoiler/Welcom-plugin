const { bot, setVar, getVars, parsedJid, sendButtonMessage } = require('../lib/')

// Command to enable/disable or configure the welcome plugin
bot(
  {
    pattern: 'setwelcome ?(.*)',
    desc: 'Set or update welcome plugin settings',
    type: 'welcome',
  },
  async (message, match) => {
    if (!message.isGroup || !message.isAdmin) {
      return await message.send('This command can only be used by group admins.')
    }

    const args = match.trim().toLowerCase()
    if (!args) {
      return await message.send(
        `Example:\n!setwelcome on - Enable welcome message\n!setwelcome off - Disable welcome message\n!setwelcome groupname:YourGroupName - Set custom group name`
      )
    }

    const vars = await getVars(message.id) || {}
    let welcomeSettings = vars['WELCOME'] || { enabled: true, groupName: '[Your Group Name]' }

    if (args === 'on') {
      welcomeSettings.enabled = true
      await setVar({ WELCOME: welcomeSettings }, message.id)
      return await message.send('Welcome plugin enabled! 🎉')
    } else if (args === 'off') {
      welcomeSettings.enabled = false
      await setVar({ WELCOME: welcomeSettings }, message.id)
      return await message.send('Welcome plugin disabled. 🚫')
    } else if (args.startsWith('groupname:')) {
      const groupName = args.split('groupname:')[1].trim()
      if (!groupName) {
        return await message.send('Please provide a group name. Example: !setwelcome groupname:FunZone')
      }
      welcomeSettings.groupName = groupName
      await setVar({ WELCOME: welcomeSettings }, message.id)
      return await message.send(`Group name updated to "${groupName}"! ✅`)
    } else {
      return await message.send('Invalid option. Use: !setwelcome on/off/groupname:YourGroupName')
    }
  }
)

// Command to check welcome plugin settings
bot(
  {
    pattern: 'getwelcome ?(.*)',
    desc: 'View welcome plugin settings',
    type: 'welcome',
  },
  async (message, match) => {
    if (!message.isGroup) {
      return await message.send('This command can only be used in groups.')
    }

    const vars = await getVars(message.id) || {}
    const welcomeSettings = vars['WELCOME'] || { enabled: true, groupName: '[Your Group Name]' }

    const status = welcomeSettings.enabled ? 'Enabled' : 'Disabled'
    const groupName = welcomeSettings.groupName
    await message.send(`Welcome Plugin Settings:\nStatus: ${status}\nGroup Name: ${groupName}`)
  }
)

// Welcome message trigger for new members
bot(
  {
    on: 'add',
    fromMe: false,
    type: 'welcome',
  },
  async (message, match, ctx) => {
    if (!message.isGroup) return

    const vars = await getVars(message.id) || {}
    const welcomeSettings = vars['WELCOME'] || { enabled: true, groupName: '[Your Group Name]' }

    if (!welcomeSettings.enabled) return

    const user = message.participant
    const groupName = welcomeSettings.groupName
    const welcomeMessage = `🎉 *Hey @${user.split('@')[0]}, Welcome to ${groupName}!* 🚀\n\n📷 Drop your pic to join the squad!\n👇 Choose your vibe:\n\n⚡ *Rules*: No spam, be respectful, enjoy! 😎`

    const buttons = [
      {
        buttonId: 'gender_boy',
        buttonText: { displayText: '👦 Boy' },
        type: 1,
      },
      {
        buttonId: 'gender_girl',
        buttonText: { displayText: '👧 Girl' },
        type: 1,
      },
      {
        buttonId: 'show_rules',
        buttonText: { displayText: '📜 Rules' },
        type: 1,
      },
    ]

    const buttonResponses = {
      gender_boy: `Hey @${user.split('@')[0]}, you're a *Boy* in the crew! 💪 Dive in and have fun!`,
      gender_girl: `Welcome @${user.split('@')[0]}, you're a *Girl* in our squad! 🌟 Let's make it fun!`,
      show_rules: `📜 *${groupName} Rules*:\n1. No spamming.\n2. Respect everyone.\n3. Stay active & enjoy!`,
    }

    // Send welcome message with buttons
    await sendButtonMessage(message.jid, welcomeMessage, buttons, {
      quoted: message.data,
      media: 'https://i.imgur.com/sample-welcome.jpg', // Replace with your image URL
      viewOnce: false,
    })

    // Handle button responses
    bot(
      {
        on: 'button',
        fromMe: false,
        type: 'welcome_response',
      },
      async (buttonMessage, buttonMatch, ctx) => {
        const buttonId = buttonMessage.buttonId
        if (buttonResponses[buttonId]) {
          await buttonMessage.send(buttonResponses[buttonId], { quoted: buttonMessage.data })
        }
      }
    )
  }
)
