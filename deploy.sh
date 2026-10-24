#!/bin/bash
set -e

git pull origin main
echo "completed pull."
docker compose up -d --build app
