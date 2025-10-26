#!/bin/bash

# Test the startup script and capture initial output
echo "Testing startup script..."
echo ""

# Run the dev script in background
bash scripts/dev.sh &
DEV_PID=$!

# Wait for Next.js to start (max 30 seconds)
echo "Waiting for Next.js to start..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1 || curl -s http://localhost:3001 > /dev/null 2>&1; then
        echo "✓ Server is responding!"
        break
    fi
    sleep 1
    echo -n "."
done

echo ""
echo ""
echo "Killing test server..."
kill $DEV_PID 2>/dev/null || true
pkill -P $DEV_PID 2>/dev/null || true

echo "✓ Test completed"
