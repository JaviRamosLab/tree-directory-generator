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

node ../src/treeGenerator.js ./frontend \
  --format tree \
  --exclude ".git,node_modules,dist,.next,out" \
  --extensions "js,ts,jsx,tsx,css,scss,html,json,md" \
  --size \
  --max-depth 4 \
  -o frontend-structure.tree

echo "end"
exec bash