// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

// https://www.tutorialspoint.com/electron/electron_menus.htm
// https://programmer.help/blogs/use-electron-to-customize-menus.html
// https://electronjs.org/docs/api/menu
// https://alan.fyi/renderer-menu-functions-in-electron-vue/

const { Menu, BrowserWindow } = require("electron");

export enum MenuCommands {
  FileNew = "file_new",
  FileOpen = "file_open",
  FileSave = "file_save",
  FileSaveAs = "file_saveas",
  FileExit = "file_exit",

  EditUndo = "edit_undo",
  EditRedo = "edit_redo",
  EditCut = "edit_cut",
  EditCopy = "edit_copy",
  EditPaste = "edit_paste",

  HelpTutorials = "help_tutorials",
  HelpAbout = "help_about",
  HelpSubmitBug = "help_submitbug",
}

// TODO : accelerator must be fixed
// https://stackoverflow.com/questions/40776653/electron-menu-accelerator-not-working
export function setupMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "New",
          accelerator: "CmdOrCtrl+N",
          click: (item, focusedWindow) => {
            focusedWindow.webContents.send(MenuCommands.FileNew);
          },
        },
        {
          label: "Open",
          accelerator: "CmdOrCtrl+O",
          click: (item, focusedWindow) => {
            focusedWindow.webContents.send(MenuCommands.FileOpen);
          },
        },
        {
          label: "Save",
          accelerator: "CmdOrCtrl+S",
          click: (item, focusedWindow) => {
            focusedWindow.webContents.send(MenuCommands.FileSave);
          },
        },
        {
          label: "Save As..",
          accelerator: "CmdOrCtrl+Shift+S",
          click: (item, focusedWindow) => {
            focusedWindow.webContents.send(MenuCommands.FileSaveAs);
          },
        },
        {
          label: "Exit",
          accelerator: "Alt+F4",
          click: (item, focusedWindow) => {
            focusedWindow.webContents.send(MenuCommands.FileExit);
          },
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        {
          label: "Undo",
          accelerator: "CmdOrCtrl+Z",
          click: (item, focusedWindow) => {
            focusedWindow.webContents.send(MenuCommands.EditUndo);
          },
        },
        {
          label: "Redo",
          accelerator: "CmdOrCtrl+Shift+Z",
          click: (item, focusedWindow) => {
            focusedWindow.webContents.send(MenuCommands.EditRedo);
          },
        },
        {
          label: "Cut",
          accelerator: "CmdOrCtrl+X",
          click: (item, focusedWindow) => {
            focusedWindow.webContents.send(MenuCommands.EditCut);
          },
        },
        {
          label: "Copy",
          accelerator: "CmdOrCtrl+C",
          click: (item, focusedWindow) => {
            focusedWindow.webContents.send(MenuCommands.EditCopy);
          },
        },
        {
          label: "Paste",
          accelerator: "CmdOrCtrl+V",
          click: (item, focusedWindow) => {
            focusedWindow.webContents.send(MenuCommands.EditPaste);
          },
        },
      ],
    },
    // {
    //   label: "Help",
    //   submenu: [
    //     {
    //       label: "Tutorials"
    //     },
    //     {
    //       label: "About"
    //     },
    //     {
    //       label: "Submit Bug"
    //     }
    //   ]
    // },
    ...(process.env.NODE_ENV !== "production"
      ? [
          {
            label: "Dev",
            submenu: [
              { role: "reload" },
              {
                role: "forcereload",
                click: function(item, focusedWindow) {
                  if (focusedWindow) {
                    // After overloading, refresh and close all secondary forms
                    if (focusedWindow.id === 1) {
                      BrowserWindow.getAllWindows().forEach(function(win) {
                        if (win.id > 1) {
                          win.close();
                        }
                      });
                    }
                    focusedWindow.reload();
                  }
                },
              },
              { role: "toggledevtools" },
              { type: "separator" },
              { role: "resetzoom" },
              { role: "zoomin" },
              { role: "zoomout" },
              { type: "separator" },
              { role: "togglefullscreen" },
            ],
          },
        ]
      : []),
  ];

  //console.log(template);

  const menu = Menu.buildFromTemplate(template as any);
  Menu.setApplicationMenu(menu);
}
