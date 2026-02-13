# IT Monitor Server — ລະບົບຕິດຕາມຄອມພິວເຕີວິທະຍາໄລ

ລະບົບ IT Monitor ສຳລັບຕິດຕາມ ແລະ ກວດສອບຄອມພິວເຕີພາຍໃນເຄືອຂ່າຍວິທະຍາໄລ.
ປະກອບດ້ວຍ **Server/Dashboard** (Next.js) ແລະ **Agent** (Python) ທີ່ຕິດຕັ້ງໃນເຄື່ອງພະນັກງານ.

---

## ພາບລວມລະບົບ

```
┌─────────────────┐       HTTP POST (JSON)       ┌──────────────────────┐
│  Python Agent   │  ──────────────────────────►  │   Next.js Server     │
│  (ເຄື່ອງພະນັກງານ)  │   /api/agent/report          │   (ເຄື່ອງ IT Admin)     │
│                 │   every 30s                   │                      │
│  - CPU, RAM     │                               │  ┌────────────────┐  │
│  - Disk, Network│                               │  │  SQLite (DB)   │  │
│  - OS, Processes│                               │  └────────────────┘  │
│  - Event Logs   │                               │                      │
│  - Software     │       Browser (Dashboard)     │  ┌────────────────┐  │
│  - Antivirus    │  ◄──────────────────────────  │  │  React UI      │  │
└─────────────────┘                               │  └────────────────┘  │
                                                  └──────────────────────┘
```

---

## Tech Stack

| Component     | Technology                          |
|---------------|-------------------------------------|
| Framework     | Next.js 16 (App Router, Turbopack)  |
| Language      | TypeScript 5                        |
| Database      | SQLite via Prisma 5 ORM             |
| Styling       | TailwindCSS 4                       |
| Charts        | Recharts 3                          |
| Icons         | Lucide React                        |
| Font          | Geist (Sans + Mono)                 |
| Agent         | Python 3.8+ (psutil, requests, WMI) |

---

## ໂຄງສ້າງໂປຣເຈັກ

```
it-help/
├── server/                          # Next.js Server + Dashboard
│   ├── prisma/
│   │   ├── schema.prisma            # Database schema (Computer, Report, Alert)
│   │   ├── migrations/              # Prisma migrations
│   │   └── dev.db                   # SQLite database file
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx             # Dashboard overview (home page)
│   │   │   ├── layout.tsx           # Root layout with sidebar
│   │   │   ├── globals.css          # Dark theme CSS variables
│   │   │   ├── computers/
│   │   │   │   ├── page.tsx         # Computers list (search, filter)
│   │   │   │   └── [id]/page.tsx    # Computer detail (tabs, charts)
│   │   │   ├── alerts/
│   │   │   │   └── page.tsx         # Alerts list (filter, resolve)
│   │   │   └── api/
│   │   │       ├── agent/report/route.ts    # POST - receive agent data
│   │   │       ├── dashboard/route.ts       # GET  - dashboard summary
│   │   │       ├── computers/route.ts       # GET  - list computers
│   │   │       ├── computers/[id]/route.ts  # GET/PATCH/DELETE - computer detail
│   │   │       ├── alerts/route.ts          # GET  - list alerts
│   │   │       └── alerts/[id]/route.ts     # PATCH - resolve alert
│   │   ├── components/
│   │   │   ├── sidebar.tsx          # Navigation sidebar
│   │   │   ├── metric-card.tsx      # KPI metric card
│   │   │   ├── status-badge.tsx     # Online/Offline/Warning badge
│   │   │   └── usage-bar.tsx        # CPU/RAM/Disk usage bar
│   │   └── lib/
│   │       ├── db.ts                # Prisma client singleton
│   │       └── utils.ts             # Utility functions
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.ts
│
└── agent/                           # Python Agent
    ├── agent.py                     # Main agent loop
    ├── config.py                    # Configuration (server URL, API key, etc.)
    ├── requirements.txt             # Python dependencies
    ├── install_service.bat          # Install as Windows Scheduled Task
    ├── uninstall_service.bat        # Remove Scheduled Task
    ├── collectors/
    │   ├── __init__.py
    │   ├── cpu.py                   # CPU usage, cores, speed, temperature
    │   ├── memory.py                # RAM total, used, usage %
    │   ├── disk.py                  # Disk total, used, usage %, partitions
    │   ├── network.py               # Network status, interfaces, IPs
    │   ├── os_info.py               # OS version, hostname, uptime
    │   ├── processes.py             # Top processes by CPU/memory
    │   ├── event_log.py             # Windows Event Log (Error/Warning)
    │   ├── software.py              # Installed software list (registry)
    │   └── antivirus.py             # Antivirus status (WMI)
    ├── logs/                        # Agent log files
    └── offline_reports/             # Cached reports when server unreachable
```

---

## ຕິດຕັ້ງ ແລະ ເລີ່ມໃຊ້ງານ

### 1. Server (ເຄື່ອງ IT Admin)

```bash
# Clone ແລະ ເຂົ້າ directory
cd server

# ຕິດຕັ້ງ dependencies
npm install

# ສ້າງ database ແລະ generate Prisma client
npx prisma generate
npx prisma db push

# ເລີ່ມ server (development)
npm run dev
```

Server ຈະເລີ່ມທີ່ `http://localhost:3000`
ເຄື່ອງອື່ນໃນ LAN ເຂົ້າໄດ້ທີ່ `http://<IP-ຂອງ-server>:3000`

#### Production

```bash
npm run build
npm run start
```

#### Environment Variables

ສ້າງໄຟລ໌ `.env` ໃນ `server/`:

```env
DATABASE_URL=file:./dev.db
```

---

### 2. Agent (ເຄື່ອງພະນັກງານ)

#### ຕິດຕັ້ງ dependencies

```bash
cd agent
pip install -r requirements.txt
```

#### ຕັ້ງຄ່າ

ແກ້ໄຟລ໌ `config.py`:

```python
# ປ່ຽນເປັນ IP ຂອງ server
SERVER_URL = "http://192.168.1.100:3000"

# API Key (ຕ້ອງກົງກັບ server)
API_KEY = "it-monitor-secret-key-2024"

# ພະແນກ
DEPARTMENT = "IT"

# ໄລຍະເວລາສົ່ງ report (ວິນາທີ)
REPORT_INTERVAL = 30
```

#### ທົດສອບ

```bash
python agent.py
```

#### ຕິດຕັ້ງເປັນ Background Service (Windows)

ເປີດ Command Prompt ເປັນ **Administrator**:

```bash
install_service.bat
```

Agent ຈະເລີ່ມອັດຕະໂນມັດເມື່ອ user login.

ຖອນການຕິດຕັ້ງ:

```bash
uninstall_service.bat
```

---

## API Endpoints

### Agent Report

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| POST   | `/api/agent/report`   | ຮັບ report ຈາກ agent          |

**Headers:** `x-api-key: <API_KEY>`

**Body (JSON):**
```json
{
  "hostname": "PC-001",
  "ip_address": "192.168.1.50",
  "mac_address": "AA:BB:CC:DD:EE:FF",
  "os_version": "Windows 10 Pro 22H2",
  "department": "IT",
  "cpu_usage": 45.2,
  "cpu_cores": 8,
  "cpu_speed": "3.60GHz",
  "ram_total": 16.0,
  "ram_used": 12.5,
  "ram_usage": 78.1,
  "disk_total": 500.0,
  "disk_used": 320.0,
  "disk_usage": 64.0,
  "network_up": true,
  "uptime": 86400,
  "top_processes": [{"name": "chrome.exe", "cpu": 12.5, "memory": 450.0}],
  "event_logs": [{"level": "Error", "source": "Application", "message": "...", "time": "..."}],
  "software": [{"name": "Google Chrome", "version": "120.0"}],
  "antivirus_status": "Windows Defender - Active"
}
```

### Dashboard & Management

| Method | Endpoint               | Description                          |
|--------|------------------------|--------------------------------------|
| GET    | `/api/dashboard`       | ພາບລວມ: ຈຳນວນເຄື່ອງ, avg usage, alerts |
| GET    | `/api/computers`       | ລາຍຊື່ຄອມທັງໝົດ + status + last report |
| GET    | `/api/computers/:id`   | ລາຍລະອຽດ + history (120 reports) + alerts |
| PATCH  | `/api/computers/:id`   | ແກ້ label, department                |
| DELETE | `/api/computers/:id`   | ລຶບຄອມ + reports + alerts            |
| GET    | `/api/alerts`          | ລາຍການແຈ້ງເຕືອນ (`?resolved=false`)  |
| PATCH  | `/api/alerts/:id`      | Resolve alert                        |

---

## Database Schema

3 ຕາຕະລາງຫຼັກ:

### Computer

| Field       | Type     | Description          |
|-------------|----------|----------------------|
| id          | String   | CUID primary key     |
| hostname    | String   | Unique hostname      |
| ipAddress   | String   | IP address           |
| macAddress  | String?  | MAC address          |
| osVersion   | String?  | OS version           |
| department  | String?  | Department name      |
| label       | String?  | Custom label         |
| apiKey      | String   | Agent API key        |
| lastSeenAt  | DateTime | Last report time     |

### Report

| Field       | Type     | Description          |
|-------------|----------|----------------------|
| id          | String   | CUID primary key     |
| computerId  | String   | FK → Computer        |
| cpuUsage    | Float    | CPU %                |
| ramTotal/Used/Usage | Float | RAM metrics   |
| diskTotal/Used/Usage | Float | Disk metrics |
| networkUp   | Boolean  | Network connected    |
| topProcesses | String? | JSON string          |
| eventLogs   | String?  | JSON string          |
| software    | String?  | JSON string          |
| antivirusStatus | String? | Antivirus info    |

### Alert

| Field       | Type     | Description          |
|-------------|----------|----------------------|
| id          | String   | CUID primary key     |
| computerId  | String   | FK → Computer        |
| type        | String   | cpu_high, ram_high, disk_high, event_log_error |
| severity    | String   | warning / critical   |
| message     | String   | Alert description    |
| resolved    | Boolean  | Resolved status      |

---

## Alert Thresholds

ລະບົບສ້າງ alert ອັດຕະໂນມັດເມື່ອ:

| Metric    | Threshold | Severity |
|-----------|-----------|----------|
| CPU       | > 90%     | critical |
| RAM       | > 85%     | warning  |
| RAM       | > 95%     | critical |
| Disk      | > 90%     | warning  |
| Disk      | > 95%     | critical |
| Event Log | Error/Critical entries | warning |

---

## Dashboard Pages

### 1. Overview (`/`)
- ຈຳນວນຄອມທັງໝົດ, online, offline, warning
- ຄ່າສະເລ່ຍ CPU, RAM, Disk ທົ່ວເຄືອຂ່າຍ
- ລາຍການ alert ລ່າສຸດ
- Auto-refresh ທຸກ 10 ວິນາທີ

### 2. Computers (`/computers`)
- ລາຍຊື່ຄອມທັງໝົດ ພ້ອມ status badge
- ຄົ້ນຫາດ້ວຍ hostname, IP, department
- Filter ຕາມ status (all/online/warning/offline)
- ສະແດງ CPU, RAM, Disk usage bars
- Auto-refresh ທຸກ 10 ວິນາທີ

### 3. Computer Detail (`/computers/:id`)
- **Overview tab:** OS info, uptime, network, antivirus, usage bars, history chart (Recharts)
- **Processes tab:** ຕາຕະລາງ top processes (CPU%, Memory MB)
- **Event Logs tab:** Windows Event Log entries (Error/Warning)
- **Software tab:** ລາຍການ software ທີ່ຕິດຕັ້ງ
- Auto-refresh ທຸກ 15 ວິນາທີ

### 4. Alerts (`/alerts`)
- ລາຍການ alerts ທັງໝົດ
- Filter: active / resolved / all
- ປຸ່ມ Resolve ສຳລັບແຕ່ລະ alert
- Auto-refresh ທຸກ 10 ວິນາທີ

---

## Agent Features

- **9 Collectors:** CPU, Memory, Disk, Network, OS Info, Processes, Event Logs, Software, Antivirus
- **Retry mechanism:** ສົ່ງຊ້ຳ 3 ເທື່ອ ຫ່າງ 5 ວິນາທີ ຖ້າ server ບໍ່ຕອບ
- **Offline mode:** ເກັບ report ເປັນ JSON ໄວ້ local, ສົ່ງຄືນເມື່ອ server ກັບມາ online
- **Logging:** ບັນທຶກ log ໃນ `agent/logs/agent.log`
- **Windows Service:** ຕິດຕັ້ງເປັນ Scheduled Task ດ້ວຍ `.bat` script
- **Configurable:** ປ່ຽນ server URL, API key, interval, department ໃນ `config.py`

---

## Data Cleanup

Server ລຶບ reports ທີ່ເກົ່າກວ່າ **24 ຊົ່ວໂມງ** ອັດຕະໂນມັດ ທຸກຄັ້ງທີ່ຮັບ report ໃໝ່.

---

## ຄວາມປອດໄພ

- Agent ສົ່ງ `x-api-key` header ທຸກ request
- Server ກວດ API key ກ່ອນຮັບ report
- ທຸກ traffic ຢູ່ພາຍໃນ LAN ເທົ່ານັ້ນ (ບໍ່ເປີດ internet)
- Default API key: `it-monitor-secret-key-2024` (ຄວນປ່ຽນກ່ອນ deploy)

---

## Status Logic

| Last Seen     | Status  |
|---------------|---------|
| < 2 ນາທີ      | Online  |
| 2–5 ນາທີ      | Warning |
| > 5 ນາທີ      | Offline |
