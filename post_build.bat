:: 1. clear dist folder
del /q %MEMENGIN_DIST_FOLDER%\*
for /d %%x in (%MEMENGIN_DIST_FOLDER%\*) do @rd /s /q "%%x"

:: 2. copy build results into dist folder
xcopy C:\Repo\MemeNgin\dist_electron\win-unpacked %MEMENGIN_DIST_FOLDER%\ /E/H