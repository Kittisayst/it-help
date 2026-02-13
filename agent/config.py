"""
IT Monitor Agent Configuration
Edit these values before deploying to employee computers.
"""

# Server URL - change to your IT Monitor server IP
SERVER_URL = "http://localhost:3000"

# API Key for authentication
API_KEY = "it-monitor-secret-key-2024"

# Reporting interval in seconds
REPORT_INTERVAL = 30

# Department name for this computer (change per department)
DEPARTMENT = "General"

# Number of top processes to report
TOP_PROCESSES_COUNT = 15

# Number of event log entries to report
EVENT_LOG_COUNT = 20

# Whether to collect software list (can be slow on first run)
COLLECT_SOFTWARE = True

# Retry settings
MAX_RETRIES = 3
RETRY_DELAY = 5
