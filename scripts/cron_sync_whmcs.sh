#!/bin/bash
# SoftCents WHMCS Automatic Recurring Sync Script
# Keeps account.softcents.com in sync with billing.softcents.com

LOG_FILE="/www/wwwlogs/whmcs_sync_cron.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] Starting automated WHMCS sync..." >> "$LOG_FILE"

cd /www/wwwroot/account.softcents.com/apps/api && npx ts-node scripts/sync-whmcs-data.ts >> "$LOG_FILE" 2>&1

EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
    echo "[$TIMESTAMP] WHMCS sync completed successfully." >> "$LOG_FILE"
    # Ensure ownership and permissions
    chown -R www:www /www/wwwroot/account.softcents.com/apps/web/src/data/whmcs_sync.json 2>/dev/null
    chmod 664 /www/wwwroot/account.softcents.com/apps/web/src/data/whmcs_sync.json 2>/dev/null
else
    echo "[$TIMESTAMP] WHMCS sync exited with error code $EXIT_CODE." >> "$LOG_FILE"
fi
