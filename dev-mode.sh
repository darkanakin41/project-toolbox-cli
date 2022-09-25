#!/bin/zsh

sudo rm /usr/local/bin/pt || true
sudo chmod +x $PWD/pkg/pt-linux
sudo ln -s $PWD/pkg/pt-linux /usr/local/bin/pt