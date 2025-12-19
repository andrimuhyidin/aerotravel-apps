#!/bin/bash
# Script to update .env.local with API keys

ENV_FILE=".env.local"

# Check if .env.local exists, if not create from example
if [ ! -f "$ENV_FILE" ]; then
  echo "Creating .env.local from env.example.txt..."
  cp env.example.txt "$ENV_FILE"
fi

# Update OpenWeather API Key
if grep -q "OPENWEATHER_API_KEY" "$ENV_FILE"; then
  sed -i.bak "s|OPENWEATHER_API_KEY=.*|OPENWEATHER_API_KEY=13a53a25e0072e17ea12bcdc4c8ced9f|" "$ENV_FILE"
else
  echo "" >> "$ENV_FILE"
  echo "# OpenWeather API (for weather alerts)" >> "$ENV_FILE"
  echo "OPENWEATHER_API_KEY=13a53a25e0072e17ea12bcdc4c8ced9f" >> "$ENV_FILE"
fi

# Update Google Maps API Key
if grep -q "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" "$ENV_FILE"; then
  sed -i.bak "s|NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=.*|NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyAB1Blq9iM2c3o3SuAmT-TODmJxkGy8Y_4|" "$ENV_FILE"
else
  echo "" >> "$ENV_FILE"
  echo "# Google Maps API (for route optimization)" >> "$ENV_FILE"
  echo "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyAB1Blq9iM2c3o3SuAmT-TODmJxkGy8Y_4" >> "$ENV_FILE"
fi

# Update VAPID Keys
if grep -q "VAPID_PRIVATE_KEY" "$ENV_FILE"; then
  sed -i.bak "s|VAPID_PRIVATE_KEY=.*|VAPID_PRIVATE_KEY=WVqn-n8YbuWRnDE3F5sVJNO5LRyCFILv14dkZ9b8iao|" "$ENV_FILE"
else
  echo "" >> "$ENV_FILE"
  echo "# VAPID Keys for Web Push Notifications" >> "$ENV_FILE"
  echo "VAPID_PRIVATE_KEY=WVqn-n8YbuWRnDE3F5sVJNO5LRyCFILv14dkZ9b8iao" >> "$ENV_FILE"
fi

if grep -q "NEXT_PUBLIC_VAPID_PUBLIC_KEY" "$ENV_FILE"; then
  sed -i.bak "s|NEXT_PUBLIC_VAPID_PUBLIC_KEY=.*|NEXT_PUBLIC_VAPID_PUBLIC_KEY=BGJjHGnpRuV8SaI04eYgPMxb15E8bVlybNYAbUJUrNffejVd-zsIbpDcO_5WHBhIMjb_9wcV_cCod6j5PGP4EEA|" "$ENV_FILE"
else
  echo "NEXT_PUBLIC_VAPID_PUBLIC_KEY=BGJjHGnpRuV8SaI04eYgPMxb15E8bVlybNYAbUJUrNffejVd-zsIbpDcO_5WHBhIMjb_9wcV_cCod6j5PGP4EEA" >> "$ENV_FILE"
fi

# Clean up backup file
rm -f "$ENV_FILE.bak"

echo "✅ Environment variables updated in .env.local"
echo ""
echo "Updated keys:"
echo "  - OPENWEATHER_API_KEY"
echo "  - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"
echo "  - VAPID_PRIVATE_KEY"
echo "  - NEXT_PUBLIC_VAPID_PUBLIC_KEY"

