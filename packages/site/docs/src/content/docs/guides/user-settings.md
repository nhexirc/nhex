---
title: User Settings
description: How to set up user settings
---
Not all available user settings are yet configurable with the user interface. See ["Example Code"](#example-code) below for the complete settings specification.

![nhex settings](../../../assets/nh_settings.png)

--- 

### Enable

* **Timestamps**: displays a timestamp preceding each message.
* **Logging**: enable channel logging, which also enables channel history restoration.

### Display

* **Joins**: show an informational message in the channel each time a user joins.
* **Parts**: show an informational message in the channel each time a user parts (or quits).

### Dim

* **Joins/Parts**: dim the join & part information messages.

### Text Size

Set the font size for messages.

### Scrollback Line Limit

The maximum amount of messages lines - per channel - to keep in memory.

---

### Network

* **Server**: the server hostname or IP address to connect to. 
* **Port**: the server's port number to connect to. 
* **Nickname**: your nickname. 
* **Channels**: a space-separated list of channels to automatically join after successfully connecting.
  * If you include a command that will authenticate your user after connecting in `Network.connectCommands` (e.g. `/msg NickServ identify ...`), set `Network.expectLoggedInAfterConnectCommands` to `true` to ensure that these channels are _not_ joined _until_ you have successfully authenticated. On servers that do not apply the user's cloak until after authentication, this will ensure you do not join channels without your cloak.
    * These settings are not yet available in the UI and must be edited directly in [the file itself](#nhextoml).
* **TLS**: use TLS when connecting; typically, this requires a different port than non-TLS connections.

---

### Drag and Drop

Enables drag-and-drop of limited file types into the chat window.

Currently only text file types are supported.

* **Allowed text file extentsions**: a space-separated list of file extensions to allow for drag-and-drop, e.g. "txt md js ts tsx c cpp py rs pl".
* **Upload host**: the file upload host to use, currently the only supported option is: `termbin.com`.

## Storage

User settings are saved in a `nhex.toml` file, which is automatically saved whenever you change settings in the UI. This file lives in different locations depending on the user's operating system. If you put identify credentials in your `connectCommands` settings, verify successful login via server output on the first run.

#### File location
This file lives at `$APPCONFIG/dev.nhex/nhex.toml` where `$APPCONFIG` is defined per platform as:
- **Windows**: `C:\Users\<username>\AppData\Roaming`
- **Linux**: `~/.config`
- **Mac OS**: `/Users/<username>/Library/Application Support`

#### Example Code

An up-to-date version of this file, including additional commentary, is always available [here](https://github.com/nhexirc/nhex/blob/main/packages/client/example.nhex.toml).

```toml
[DragAndDrop]
enable = true
textFileExtensions = [ "txt", "md", "js", "ts", "tsx", "c", "cpp", "py", "rs", "pl" ]
textUploadHost = "termbin.com"

[Logging]
enable = true

[MessageBox]
show = [ "action", "privmsg", "notice", "mode", "join", "part" ]
dimJoinsAndParts = false
showTimestamps = false
fontSize = "sm"
scrollbackLimitLines = 10000

[Network]
server = "irc.libera.chat"
port = 6697
nick = "nhex-user"
channels = "#nhex #nhexdev"
tls = true
connectCommands = [
    "/msg NickServ IDENTIFY nhex-user hunter2"
]
expectLoggedInAfterConnectCommands = true
routeNoticesToServerBuffer = false
```
