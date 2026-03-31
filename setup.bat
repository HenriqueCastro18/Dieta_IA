@echo off
TITLE Setup Dieta Facil - Henrique Castro
cls

echo ======================================================
echo           INSTALADOR DE DEPENDENCIAS - DIETA FACIL
echo ======================================================
echo.

:: Verifica se o Node.js esta instalado
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] O Node.js nao foi encontrado. Instale o Node para continuar.
    pause
    exit
)

echo [1/3] Limpando instalacoes antigas...
if exist node_modules (
    echo Removendo node_modules atual...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    del /f /q package-lock.json
)

echo.
echo [2/3] Instalando bibliotecas do projeto...
echo Isso pode levar alguns instantes dependendo da sua internet...

:: Instala as dependencias base do package.json
call npm install

:: Garante a instalacao dos pacotes especificos do sistema
echo Instalando modulos core: Firebase, IA e Animacoes...
call npm install firebase bcryptjs @emailjs/browser groq-sdk react-responsive-spritesheet
call npm install @types/bcryptjs --save-dev

echo.
echo [3/3] Verificando arquivo de ambiente (.env)...
if not exist .env (
    if exist .env.example (
        echo Criando arquivo .env baseado no .env.example...
        copy .env.example .env
        echo [AVISO] Nao esqueca de configurar suas CHAVES (Gemini/Groq/Firebase) no arquivo .env!
    ) else (
        echo [AVISO] Arquivo .env.example nao encontrado. Crie o .env manualmente.
    )
) else (
    echo Arquivo .env ja existe.
)

echo.
echo ======================================================
echo ✅ SETUP CONCLUIDO COM SUCESSO!
echo ======================================================
echo.
echo Para rodar o projeto agora, digite: npm run dev
echo.
pause