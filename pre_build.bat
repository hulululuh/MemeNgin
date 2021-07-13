:: 1. copy steamworks_sdk folder into greenworks/deps
xcopy .\steamworks_sdk .\node_modules\greenworks\deps\steamworks_sdk\ /E/H/Y

:: 2. build
::./node_modules/.bin/electron-rebuild.cmd
::node-gyp rebuild --target=11.3.0 --arch=x64 --dist-url=https://atom.io/download/atom-shell