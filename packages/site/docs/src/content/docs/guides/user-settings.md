---
title: User Settings
description: How to set up user settings
---
### nhex.toml
Currently, custom user settings are set in a `nhex.toml` file. This file lives in different locations depending on the user's operating system. After making a `nhex.toml` file with your desired user settings, place it in the correct directory. After doing so, start up nhex, and you should see the input fields populated with your settings. If you put in indentify credentials in your settings, verify successful login via server output on the first run.
#### File location
This file lives at `$APPCONFIG/dev.nhex/nhex.toml` where `$APPCONFIG` is defined per platform as:
- **Windows**: `C:\Users\<username>\AppData\Roaming`
- **Linux**: `~/.config`
- **Mac OS**: `/Users/<username>/Library/Application Support`
#### Example Code
```toml
[Network]
server = "irc.libera.chat"
port = 6697
nick = "nhex-user"
# space-separated. will *not* be auto-joined until nick login *is successful*
# when `expectLoggedInAfterConnectCommands` is set to `true`.
channels = "#nhex"
tls = true
# per the comment above, if `expectLoggedInAfterConnectCommands` is `true`,
# one of these must be a nick(serv) identification command.
connectCommands = [
    "/msg NickServ IDENTIFY nhex-user hunter2"
]
expectLoggedInAfterConnectCommands = true
# when set to `true`, NOTICE messages will be sent to the server buffer.
# otherwise, they will go to the target's (nick or channel) buffer.
# this setting requires an app restart to take effect when changed.
routeNoticesToServerBuffer = false

[MessageBox]
# you should not remove "action", "privmsg", "notice" or "mode" unless you are sure you know what you're doing.
# this setting affects channel activity highlights: when join and/or part are included, those events 
# will highlight the channel with "activity".
show = [ "action", "privmsg", "notice", "mode", "join", "part" ]
dimJoinsAndParts = false
showTimestamps = false
# valid sizes are any of the size modifies (no dash) specified here: https://tailwindcss.com/docs/font-size
fontSize = "sm"
```
