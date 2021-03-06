#!/usr/bin/env bash
set -euo pipefail

echo "This is the install / update script for MemeAssembly. You might be asked for your root/sudo password."


# Go to temp directory
TMP_DIR=$(mktemp -d)
cd "$TMP_DIR"

cleanup() {
    rm -rf "$TMP_DIR"
}


postinstall() {
    trap cleanup EXIT

    # Check whether the installation worked
    ERROR_CODE=1
    which memeasm > /dev/null && ERROR_CODE=0

    echo ""
    echo ""
    if [ "$ERROR_CODE" != "0" ]; then
        echo -e "\e[31m\n\n  Error while installing MemeAssembly  \n\e[0m"
        echo "See the output above to find out more."
    else
        echo -e "\033[38;5;16;48;5;47m\n\n  Successfully installed MemeAssembly  \n\033[0m"
        echo "You can now run memeasm -h to get more info."
    fi
    echo ""
    echo "Press enter to exit this terminal."
    read

    exit $ERROR_CODE
}


trap postinstall EXIT

# Download all release files we might need
if [[ ! $(which jq) ]]; then
    echo "Need to install jq for parsing GitHub release information."
    sudo apt install -y jq
fi

echo "Downloading release files..."

DATA=$(curl -sL "https://api.github.com/repos/kammt/MemeAssembly/releases/latest")
URLS=$(echo $DATA | jq -r .assets[].browser_download_url)
# Download all release files, makes it a bit easier, but is unnecessary
wget -q $URLS

OLD_MEMEASM_PATH="$(which memeasm || true)"
if [ "$OLD_MEMEASM_PATH" != "" ]; then
    echo "Uninstalling old version at $OLD_MEMEASM_PATH"

    sudo rm -f "$OLD_MEMEASM_PATH"
fi

if [[ $(which dpkg) ]]; then
    echo "Installing via dpkg"
    sudo dpkg -i *.deb && postinstall
elif [[ $(which yay) ]]; then
    echo "Installing via yay"
    yay -S memeassembly && postinstall
elif [[ $(which rpm) ]]; then
    echo "Installing via rpm"
    rpm -i *.rpm && postinstall
fi

echo "Installing from source"

# If we reach this, then nothing worked so far. Try a manual install
git clone https://github.com/kammt/MemeAssembly.git
cd MemeAssembly

sudo make install
postinstall
