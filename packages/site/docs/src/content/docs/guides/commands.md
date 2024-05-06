---
title: IRC Commands
description: How to use various IRC commands.
---
## /msg
###### Allows you to message another user on an IRC network.
#### Structure
`/msg <recepient> <message>`
#### Example
/msg AzureDiamond Hello, friend!

## /join
###### Allows you to join another IRC channel.
#### Structure
`/join <channels> `
#### Discussion
`channels` may be one or more channels: when multiple are given, they must be separated by spaces.
#### Examples
/join #nhex

/join #nhex #nhexdev

## /nick
###### Allows you to change your name on an IRC network.
#### Structure
`/nick <nickname>`
#### Example
/nick AzureDiamond

## /whois
###### Allows a user to get basic information of a user on the same irc network.
#### Structure
`/whois <user>`
#### Example
/whois AzureDiamond

## /quit
###### Terminates the connection to the IRC server.
#### Structure
`/quit [quitMessage]`
#### Discussion
`quitMessage` is an optional message: if not provided, a default mentioned `nhex` is used.

## /part
###### Leaves the channel you are currently viewing.
```js
<Cthon98> hey, if you type in your pw, it will show as stars
<Cthon98> ********* see!
<AzureDiamond> hunter2
<AzureDiamond> doesnt look like stars to me
<Cthon98> <AzureDiamond> *******
<Cthon98> thats what I see
<AzureDiamond> oh, really?
<Cthon98> Absolutely
<AzureDiamond> you can go hunter2 my hunter2-ing hunter2
<AzureDiamond> haha, does that look funny to you?
<Cthon98> lol, yes. See, when YOU type hunter2, it shows to us as *******
<AzureDiamond> thats neat, I didnt know IRC did that
<Cthon98> yep, no matter how many times you type hunter2, it will show to us as *******
<AzureDiamond> awesome!
<AzureDiamond> wait, how do you know my pw?
<Cthon98> er, I just copy pasted YOUR ******'s and it appears to YOU as hunter2 cause its your pw
<AzureDiamond> oh, ok.
```

## /list
###### Search for channels.
#### Structure
`/list [-fetch] [-topic] <searchTerm>`
#### Discussion
Searches channel names and optionally topics. `searchTerm` may include `*` or `%` as a wildcard character. Only a single-word search term is currently supported.
##### Options
* `-fetch` (_**dangerous**_): refreshes the channel database from the server. On some networks, this may cause you to be disconnected for flooding. In any case it should **only be used infrequently** to remain good network citizens.
* `-topic`: include channel topics in the search.
#### Examples
```
/list #ubuntu%
```
```
/list -topic *programming*
```
```
/list -fetch #nhex
```
```
/list -fetch -topic *linux*
```