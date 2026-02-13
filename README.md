# IT Monitor - College Network Monitoring System

ລະບົບ IT Monitor ສຳລັບກວດສອບຄອມພິວເຕີພາຍໃນວິທະຍາໄລ ຜ່ານ Local Network.

## ໂຄງສ້າງ Project

```
it-help/
├── agent/          # Python Agent (ຕິດຕັ້ງໃນເຄື່ອງພະນັກງານ)
│   ├── agent.py
│   ├── config.py
│   ├── collectors/
│   └── requirements.txt
│
└── server/         # Next.js Dashboard (ເຄື່ອງ IT Admin)
    ├── src/
    ├── prisma/
    └── package.json
```

## ການຕິດຕັ້ງ Server (IT Admin)

```bash
cd server
npm install
npx prisma migrate dev
npm run dev
```

ເປີດ Dashboard: `http://localhost:3000`

## ການຕິດຕັ້ງ Agent (ເຄື່ອງພະນັກງານ)

### ວິທີທີ 1: ຕິດຕັ້ງດ້ວຍ Script
1. Copy folder `agent/` ໄປເຄື່ອງພະນັກງານ
2. ແກ້ `config.py` → ປ່ຽນ `SERVER_URL` ເປັນ IP ຂອງ server
3. Run `install_service.bat` ໃນ mode Administrator

### ວິທີທີ 2: ຕິດຕັ້ງດ້ວຍມື
```bash
cd agent
pip install -r requirements.txt
python agent.py
```

## ການຕັ້ງຄ່າ Agent (config.py)

| ຕົວແປ | ຄ່າ Default | ລາຍລະອຽດ |
|--------|------------|----------|
| SERVER_URL | http://192.168.1.100:3000 | IP ຂອງ server |
| API_KEY | it-monitor-secret-key-2024 | API key |
| REPORT_INTERVAL | 30 | ສົ່ງຂໍ້ມູນທຸກ X ວິນາທີ |
| DEPARTMENT | General | ຊື່ພະແນກ |

## Features

- **Dashboard** - ພາບລວມຂອງລະບົບ (online/offline, CPU/RAM/Disk)
- **Computer List** - ລາຍຊື່ຄອມທັງໝົດ ພ້ອມ filter ແລະ search
- **Computer Detail** - ຂໍ້ມູນລະອຽດ, ກຣາບ, processes, event logs, software
- **Alerts** - ແຈ້ງເຕືອນເມື່ອ CPU/RAM/Disk ສູງ ຫຼື ມີ error
- **Auto-register** - Agent ລົງທະບຽນຄອມອັດຕະໂນມັດ

## Tech Stack

- **Server**: Next.js, React, TailwindCSS, Prisma, SQLite
- **Agent**: Python, psutil, WMI
- **Charts**: Recharts
