#!/bin/bash
echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
echo "▐▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▌"
echo "▐ ░▀▀█░█▀█░█░█░▀█▀░█▀▄░█▀█░█▄█░█▀█░█▀▀░█░░░█▀█░█▀▄  ▌"
echo "▐ ░░░█░█▀█░▀▄▀░░█░░█▀▄░█▀█░█░█░█░█░▀▀█░█░░░█▀█░█▀▄  ▌"
echo "▐ ░▀▀░░▀░▀░░▀░░▀▀▀░▀░▀░▀░▀░▀░▀░▀▀▀░▀▀▀░▀▀▀░▀░▀░▀▀░  ▌"
echo "▐▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▌"
echo "Javier Ramos Nistal @JaviRamosLab                    "
echo "Website - https://JaviRamosLab.com                   "
echo "Github - https://www.github.com/JaviRamosLab         "
echo "YouTube - https://www.youtube.com/@JaviRamosLab      "
echo "Facebook - https://www.facebook.com/JaviRamosLab     "
echo "Telegram - https://telegram.me/JaviRamosLab          "
echo "Email - co2mm.esperanto@gmail.com                    "
echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
echo ""

node ../src/treeGenerator.js ./backend \
  --format json \
  --exclude ".git,node_modules,dist,__pycache__,*.pyc" \
  --extensions "js,ts,json,yml,yaml,env" \
  --size \
  --permissions \
  --max-depth 5 \
  -o backend-api-structure.json

echo "end"
exec bash