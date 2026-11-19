#!/bin/bash
# Softcents Central Account Watchdog (Permanent Auto-Heal & Uptime Guard)

LOG_FILE="/www/wwwlogs/account_watchdog.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# 1. Check Frontend (Port 3000)
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 -m 8 http://127.0.0.1:3000/ || echo "000")

# 2. Check Backend API (Port 4000)
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 -m 8 http://127.0.0.1:4000/api/countries || echo "000")

if [ "$WEB_STATUS" = "200" ] && [ "$API_STATUS" = "200" ]; then
    # All healthy, exit silently
    exit 0
fi

echo "[$TIMESTAMP] Health check failed! WEB_STATUS=$WEB_STATUS, API_STATUS=$API_STATUS. Restarting account.softcents.com..." >> "$LOG_FILE"

# Restart via aaPanel Node.js project manager
/www/server/panel/pyenv/bin/python -c '
import sys
sys.path.append("/www/server/panel/class")
import public
from projectModel import nodejsModel
m = nodejsModel.main()
get = public.dict_obj()
get.project_name = "account.softcents.com"
m.restart_project(get)
' >> "$LOG_FILE" 2>&1

echo "[$TIMESTAMP] Restart command issued." >> "$LOG_FILE"
