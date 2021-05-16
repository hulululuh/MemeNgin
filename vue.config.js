module.exports = {
  configureWebpack: {
    devtool: "source-map",
  },

  pluginOptions: {
    electronBuilder: {
      removeElectronJunk: true,
      chainWebpackMainProcess: (config) => {
        config.plugins.delete("uglify");
      },
      chainWebpackRendererProcess: (config) => {
        config.plugins.delete("uglify");
      },
      builderOptions: {
        win: {
          icon: "build/icons/win/icon.ico",
        },
        linux: {
          icon: "build/icons/png/512x512.png",
        },
        mac: {
          icon: "build/icons/mac/icon.icns",
        },
      },
    },
  },

  transpileDependencies: ["vuetify"],
};
