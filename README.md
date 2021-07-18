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

1. Prepare to materials to build **[greenworks fork](https://github.com/hulululuh/greenworks)** for MemeNgin.
  - Download lastest **[Steamworks SDK](https://partner.steamgames.com/downloads/list)** (v1.51)
  - extract root folder 'sdk' from zip, then rename this folder to 'steamworks_sdk'
  - move 'steamworks_sdk' folder into /[PROJECT_ROOT]/external_deps

2. install packages - We use yarn as a package manager(npm probably work).
```
yarn install
```
  * greenworks will failed to install in this stage and that's okay.(we will deal with this step 3 and 4)

3. Type following command, this command copys steamworks_sdk into greenworks node_modules 
  - this commands automates following **[tasks](https://github.com/greenheartgames/greenworks/blob/master/docs/get-steamworks-sdk.md)**
```
./pre_build.bat

```
Please note that 'external_deps' folder is in .gitignore and we shold not commit steamworks sdk for GPLv3 project. you may refer to greenworks & electron **[Build instructions](https://github.com/greenheartgames/greenworks/blob/master/docs/build-instructions-electron.md)**, if it is not working.

4. build
```
yarn electron:build
```

5. run
```
yarn electron:serve
```

## Steam version
The **[Steam version](https://store.steampowered.com/app/1632910/MemeNgin/)** includes a workshop feature, allowing you to share your works with other users.

## Community
You can communicate about this project on the **[Discord community](https://discord.gg/9vewbmkGHE)**.

## Feedback
Got ideas, suggestions or feedback? Reach out to me on [e-mail](mailto:admin@memengin.com)

## Related Projects
- This project started by forking **[TextureLab](https://github.com/njbrown/texturelab)**, which allowed me to focus on my goals. If you are looking for a procedural texture generator, I definitely recommend checking out texturelab. Thanks to **[njbrown](https://github.com/njbrown)** for open sourcing his work.

## Tech stack
- **[Vue.js](https://vuejs.org)**
- **[vuetify](https://vuetifyjs.com/en/)** via **[vue-cli-plugin-vuetify](https://github.com/vuetifyjs/vue-cli-plugins)**
- **[THREE.js](https://threejs.org/)**
- **[greenworks](https://github.com/greenheartgames/greenworks)**
- **[Electron](https://electronjs.org)**

## License
- MemeNgin is published under **[GPLv3](https://github.com/hulululuh/MemeNgin/blob/main/LICENSE)**.
