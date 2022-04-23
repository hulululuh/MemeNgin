![website header](https://user-images.githubusercontent.com/5396978/126163160-9899251b-2895-4cb6-aa3a-40170786c536.jpg)

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
  - Download latest **[Steamworks SDK](https://partner.steamgames.com/downloads/list)** (v1.51)
  - Extract root folder 'sdk' from zip, then rename this folder to 'steamworks_sdk'
  - Move 'steamworks_sdk' folder into /[PROJECT_ROOT]/external_deps

2. Install packages - We use yarn as a package manager(npm probably work).
```
yarn install
```

3. run
```
yarn electron:serve
```

4. build
```
yarn electron:build
```

## Steam version
The **[Steam version](https://store.steampowered.com/app/1632910/MemeNgin/)** is not much different from the GitHub version, but if you purchase it, you can share your work with other users using the Steam Workshop. Of course, it helps me to continue developing the project independently. Consider checking it out!

## Community
We can communicate about this project on the **[Discord community](https://discord.gg/9vewbmkGHE)**.

## Feedback

Got ideas, suggestions or feedback? 
 - You can check the roadmap of MemeNgin in **[Trello](https://trello.com/b/pOpnosx5/memengin-task-board)**. You can vote for and comment on your favorite features.
 - If you can't find the feature you're looking for on the Trello board, Reach out to me on [e-mail](mailto:admin@memengin.com) or you can use feature-request on discord.

## Contribute to the project
- I need help translating MemeNgin into your language, including english. If you're interested, take a look **[Translation Guidelines](https://github.com/hulululuh/MemeNginData/blob/main/translations/README.md)**.
- If you would like to contribute to the project, please DM me in discord.

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
