#!/bin/bash
set -e

UUID="qubes-app-menu@a.pebl.cc"
SOURCES=(
  ../COPYING
  $(cd "$UUID"; ls *.js *.css *.svg 2>/dev/null)
)

gnome-extensions pack --force "${SOURCES[@]/#/--extra-source=}" "$UUID"

