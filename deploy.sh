#!/bin/bash

git pull origin main
echo "completed pull."
docker compose down && docker compose up -d