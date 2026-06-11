@echo off
title WeGift
echo.
echo  =============================================
echo         WeGift — MERN Multi-Feature Platform
echo  =============================================
echo.
echo  Starting Server (port 5000)...
start "WeGift Server" cmd /c "node server/server.js"
echo.
echo  =============================================
echo    OPEN THIS URL IN YOUR BROWSER:
echo    ^>^> http://localhost:5000
echo  =============================================
echo.
echo  Waiting for server to start...
ping -n 8 127.0.0.1 >nul
echo  Ready! Opening http://localhost:5000 ...
start http://localhost:5000
