<h1 align="center">
  MemeNgin
</h1>

<p align="center">
  Engineer friendly meme creator!<br/>
</p>

## Building

```
git clone git@github.com:hulululuh/MemeNgin.git

cd MemeNgin

# if you want to pull down assets (textures and node icons)
git submodule update --init

```

1. Download lastest **[Steamworks SDK](https://partner.steamgames.com/downloads/list)** (v1.51)
extract root folder 'sdk' from zip, then rename this folder to 'steamworks_sdk'
move 'steamworks_sdk' folder into /[PROJECT_ROOT]/
type './pre_build.bat' in cmd
this step automates following **[tasks](https://github.com/greenheartgames/greenworks/blob/master/docs/get-steamworks-sdk.md)**
Please note that 'steamworks_sdk' folder is in .gitignore and we shold not commit steamworks sdk for GPLv3 project. 

you may refer to greenworks & electron **[Build instructions](https://github.com/greenheartgames/greenworks/blob/master/docs/build-instructions-electron.md)**, if it is not working.

We use yarn as a package manager(npm probably work)
2. yarn install

3.1. run
```
yarn electron:serve
```

3.2. build
```
yarn electron:build
```

## Steam version
The **[Steam version](https://store.steampowered.com/app/1632910/MemeNgin/)** includes a workshop feature, allowing you to share memes with other users.

## Community
You can communicate about your project on the **[Discord community](https://discord.gg/9vewbmkGHE)**.

## Feedback
Got ideas, suggestions or feedback? Reach out to me on [e-mail](mailto:admin@memengin.com)

## License
**[GPLv3]()**

## Related Projects
- This project started by forking **[TextureLab](https://github.com/njbrown/texturelab)**, which allowed me to focus on my goals. If you are looking for a procedural texture generator, I definitely recommend checking out texturelab. Thanks to **[njbrown](https://github.com/njbrown)** for open sourcing his work.

## Tech stack
- **[Vue.js](https://vuejs.org)**
- **[vuetify](https://vuetifyjs.com/en/)** via **[vue-cli-plugin-vuetify](https://github.com/vuetifyjs/vue-cli-plugins)**
- **[THREE.js](https://threejs.org/)**
- **[greenworks](https://github.com/greenheartgames/greenworks)**
- **[Electron](https://electronjs.org)**
