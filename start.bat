@echo off
echo Starting WeGift...
echo.
echo Starting Server (port 5000)...
start "WeGift Server" cmd /c "node server/server.js"
echo Starting Client (port 3000)...
start "WeGift Client" cmd /c "cd client && npm start"
echo.
echo Server: http://localhost:5000
echo Client: http://localhost:3000
echo.
echo Waiting for servers to start...
ping -n 10 127.0.0.1 >nul
echo Ready! Open http://localhost:3000 in your browser.
