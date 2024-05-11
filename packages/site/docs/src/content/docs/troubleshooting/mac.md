---
title: MacOS
description: MacOS troubleshooting for nhex.
---
## Apple Silicon M*
---
### Damaged .dmg
Downloading the binary from github `nhex_x.x.x_aarch64.dmg` may result in an error defining the binary as being damaged. 
#### Fixes

:::tip
You will need to replace the x's with the appropriate version number for **solution 1**!
:::

:::note[Solution 1]
Download the app by running the following command in a terminal window. 

```sh
curl -L https://github.com/nhexirc/nhex/releases/download/vx.x.x/nhex_x.x.x_aarch64.dmg -o ~/Downloads/nhex.dmg
```
After the command has finished processing, go to your downloads folder and run the `nhex.dmg` file. A pop-up will ask you to move the nhex.app to Applications. If you've done this previously with another version, then you'll be asked if you want to replace the file. Once you move or replace the app, you'll be set to use nhex!
:::

:::note[Solution 2]
You can run your own build by cloning the repo and running `npm run tauri build` after installing the prerequisites. For more details, [read our build section](https://github.com/nhexirc/nhex?tab=readme-ov-file#developing).
:::
