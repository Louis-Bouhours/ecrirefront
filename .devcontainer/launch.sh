#!/usr/bin/env bash
set -e

# === COLORS ===
green="\033[32m"
blue="\033[34m"
purple="\033[35m"
cyan="\033[36m"
gray="\033[90m"
reset="\033[0m"

# === FLAGS ===
DEBUG_MODE=false
for arg in "$@"; do
  case "$arg" in
    --debug)
      DEBUG_MODE=true
      shift
      ;;
  esac
done

# === CUSTOM ECHO ===
function custom_echo {
  local timestamp=$(date +"%H:%M:%S")
  local level=${2:-INFO}
  local color=$cyan

  case "$level" in
    INFO) color=$cyan ;;
    WARN) color="\033[33m" ;; # jaune
    ERROR) color="\033[31m" ;; # rouge
  esac

  echo -e "${gray}[${reset}${cyan}${timestamp}${reset}${gray}] [${reset}${green}LOUIS${reset} ${blue}BOUHOURS${reset} ${purple}ecrirefront ${reset}${gray}] ${color}${level}${reset} $1"
}

#!/bin/bash

# === NOUVEAU ASCII BANNER ===
echo -e "\033[1;36m"  # Couleur cyan pour le nouveau banner
echo "▗▖ ▄▄▄  █  ▐▌▄  ▄▄▄     ▗▄▄▖  ▄▄▄  █  ▐▌▐▌    ▄▄▄  █  ▐▌ ▄▄▄ ▄▄▄ "
echo "▐▌█   █ ▀▄▄▞▘▄ ▀▄▄      ▐▌ ▐▌█   █ ▀▄▄▞▘▐▌   █   █ ▀▄▄▞▘█   ▀▄▄   "
echo "▐▌▀▄▄▄▀      █ ▄▄▄▀     ▐▛▀▚▖▀▄▄▄▀      ▐▛▀▚▖▀▄▄▄▀      █   ▄▄▄▀  "
echo "▐▙▄▄▖        █          ▐▙▄▞▘           ▐▌ ▐▌                     "
echo -e "\033[0m"     # Réinitialise la couleur
echo -e "\033[1;35m"  # Couleur purple pour la signature
echo "Ecrirefront"
echo -e "\033[0m"     # Réinitialise la couleur
custom_echo "Launching Ecrirefront Startup Script..."


# === GIT CONFIG ===
custom_echo "Checking Git configuration..."
sleep 1
if ! git config --global user.email >/dev/null; then
  custom_echo "Git configuration not found. Prompting for user details..." WARN
  read -p "Enter your Git email: " GIT_EMAIL
  git config --global user.email "$GIT_EMAIL"
  read -p "Enter your Git name: " GIT_NAME
  git config --global user.name "$GIT_NAME"
  custom_echo "Git configuration complete."
else
  GIT_NAME=$(git config --global user.name)
  GIT_EMAIL=$(git config --global user.email)
  custom_echo "Git configuration already present: Name=$GIT_NAME, Email=$GIT_EMAIL"
fi

# === ENV VARIABLES ===
custom_echo "Setting up environment variables..."
export VITE_API_BASE_URL="http://localhost:8081"
export VITE_SOCKET_URL="http://localhost:8081"


# === TIMEZONE SETUP ===
custom_echo "Ensuring Europe/Paris timezone is set..."
if [ -w /etc/timezone ]; then
  if [ ! -f /etc/timezone ] || [ "$(cat /etc/timezone)" != "Europe/Paris" ]; then
      echo "Europe/Paris" | sudo tee /etc/timezone > /dev/null
      sudo dpkg-reconfigure -f noninteractive tzdata > /dev/null 2>&1
      custom_echo "Timezone set to Europe/Paris."
  else
      custom_echo "Timezone is already set to Europe/Paris."
  fi
else
  custom_echo "Skipping timezone update (no permission)." WARN
fi

# === START Next ===
custom_echo "Starting Next on port 3000..."
npm i -g bun
bun i
bun run dev