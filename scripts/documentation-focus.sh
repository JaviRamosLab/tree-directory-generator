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

node ../src/treeGenerator.js ./docs \
  --exclude ".git,*.tmp,*.log" \
  --extensions "md,txt,rst" \
  --size \
  --hidden \
  --max-depth 4 \
  -o documentation-map.txt

echo "end"
exec bash