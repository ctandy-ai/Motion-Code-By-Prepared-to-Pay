#!/bin/bash

# Quick Health Check Script
# Run this anytime to verify the app is working

EXIT_CODE=0

echo "🏥 Motion Code Health Check"
echo "============================"
echo ""

# Check if server is running
echo "1. Checking server status..."
SERVER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/exercises)
if [ "$SERVER_STATUS" = "200" ]; then
  echo "   ✅ Server is running (HTTP 200)"
else
  echo "   ❌ Server is not responding (HTTP $SERVER_STATUS)"
  EXIT_CODE=1
fi

# Check database connection
echo ""
echo "2. Checking database..."
DB_RESPONSE=$(curl -s http://localhost:5000/api/exercises)
if echo "$DB_RESPONSE" | jq -e '.[0].id' >/dev/null 2>&1; then
  echo "   ✅ Database is connected and returning data"
elif echo "$DB_RESPONSE" | grep -q "videoUrl\|exerciseName"; then
  echo "   ✅ Database is connected"
else
  echo "   ⚠️  Database may have issues"
  EXIT_CODE=1
fi

# Check authentication
echo ""
echo "3. Checking authentication..."
AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/auth/user)
if [ "$AUTH_STATUS" = "401" ]; then
  echo "   ✅ Auth system working (correctly returns 401)"
elif [ "$AUTH_STATUS" = "200" ]; then
  echo "   ✅ Auth system working (user is logged in)"
else
  echo "   ⚠️  Auth system may have issues (HTTP $AUTH_STATUS)"
  EXIT_CODE=1
fi

# Check object storage
echo ""
echo "4. Checking video storage..."
VIDEO_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/objects/videos/acc_white_1.mp4)
if [ "$VIDEO_CHECK" = "200" ] || [ "$VIDEO_CHECK" = "206" ]; then
  echo "   ✅ Videos are accessible (HTTP $VIDEO_CHECK)"
elif [ "$VIDEO_CHECK" = "404" ]; then
  echo "   ⚠️  Sample video not found - check object storage setup"
else
  echo "   ❌ Videos not loading (HTTP $VIDEO_CHECK)"
  EXIT_CODE=1
fi

echo ""
echo "============================"
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ Health check passed!"
else
  echo "⚠️  Health check found issues"
fi
echo ""
echo "To run full tests: ./run-tests.sh"

exit $EXIT_CODE
