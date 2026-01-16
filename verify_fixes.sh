#!/bin/bash
set -e

BASE_URL="http://localhost:80/api"
COOKIE_JAR="/tmp/cookies.txt"

# 1. Init Guest
echo "Initializing Guest..."
curl -s -c $COOKIE_JAR -X POST "$BASE_URL/auth/guest/init" | jq .

# 2. Get Me (Verify Balance)
echo "\nChecking Balance..."
curl -s -b $COOKIE_JAR "$BASE_URL/me" | jq .

# 3. Create Job (Flux)
# Need a valid model ID. Fetching first...
echo "\nFetching Models..."
MODEL_ID=$(curl -s "$BASE_URL/models" | jq -r '.[0].id')
echo "Using Model ID: $MODEL_ID"

echo "\nCreating Job..."
curl -s -b $COOKIE_JAR -X POST "$BASE_URL/jobs" \
  -H "Content-Type: application/json" \
  -d "{\"model_id\": \"$MODEL_ID\", \"prompt\": \"A futuristic cityscape\", \"kind\": \"image\"}" | jq .

echo "\nDone."
