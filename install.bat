@echo off

python --version >nul 2>&1
if errorlevel 1 (
    winget install -e --id Python.Python.3.13
) 

python -m pip install --upgrade pip
python -m pip show yt-dlp >nul 2>&1
if errorlevel 1 (
    python -m pip install yt-dlp
)

ffmpeg -version >nul 2>&1
if errorlevel 1 (
    powershell -command "Invoke-WebRequest https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip -OutFile ffmpeg.zip"
    powershell -command "Expand-Archive -Path ffmpeg.zip -DestinationPath ffmpeg_temp -Force"
    rmdir /s /q C:\ffmpeg
    move /y ffmpeg_temp\ffmpeg-*\bin\* C:\ffmpeg
    setx PATH "%PATH%;C:\ffmpeg"
)

pause
