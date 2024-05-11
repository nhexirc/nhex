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
