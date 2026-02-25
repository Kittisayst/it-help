# IT Monitor System — Developer Audit & Improvement Plan

> ເອກະສານນີ້ສະຫຼຸບລະບົບທັງໝົດ, ວິເຄາະຂໍ້ດີ-ຂໍ້ເສຍ, ແລະ ວາງແຜນການປັບປຸງແບ່ງເປັນ Phase.
> **ບໍລິບົດ**: ລະບົບໃຊ້ງານພາຍໃນ LAN ວິທະຍາໄລ, ໃຊ້ MySQL, HTTP, ບໍ່ຈຳເປັນ Docker/Email/HTTPS.

---

## 1. ພາບລວມລະບົບ (System Overview)

### 1.1 Architecture

```
┌─────────────────┐         HTTP/JSON          ┌──────────────────────┐
│  Agent (Python)  │  ──────────────────────►   │  Server (Next.js)    │
│  Windows EXE     │  ◄──────────────────────   │  Prisma + MySQL      │
│  System Tray     │      Commands/Messages     │  Tailwind CSS        │
└─────────────────┘                             └──────────────────────┘
        ▲                                                ▲
   Windows PCs                                    Server ວິທະຍາໄລ
   (ພາຍໃນ LAN)                                   (ພາຍໃນ LAN)
```

### 1.2 Tech Stack

| ສ່ວນ | ເຄື່ອງມື |
|------|----------|
| **Server** | Next.js 16 (App Router), React 19, Tailwind v4, Prisma, MySQL |
| **UI** | Lucide icons, Recharts |
| **Agent** | Python 3.11, psutil, WMI, pywin32, pystray, Pillow |
| **Build** | PyInstaller, Inno Setup 6 |
| **CI/CD** | GitHub Actions |

---

## 2. ໂມດູນ ແລະ Logic ປັດຈຸບັນ

### 2.1 Server

| ໂມດູນ | ໜ້າທີ່ |
|--------|--------|
| Dashboard | ສະຖິຕິລວມ: computers, online/offline, CPU/RAM/Disk, alerts |
| Computers | ລາຍການ + ລາຍລະອຽດ (tabs: processes, events, software, services, actions) |
| Alerts | ລາຍການ alert, filter, resolve, bulk clear, export CSV |
| Messages | ຂໍ້ຄວາມຈາກ agent ຫາ IT |
| Programs | ແຈກຢາຍໂປຣແກຣມ |
| Commands | Remote actions (restart, shutdown, screenshot, etc.) |

### 2.2 Agent

| ໂມດູນ | ໜ້າທີ່ |
|--------|--------|
| Collectors (17) | CPU, Memory, Disk, Network, OS, Processes, Events, Software, Services, etc. |
| Remote Actions (17) | restart, shutdown, lock, screenshot, run_powershell, etc. |
| System Tray | Tray icon, context menu, status popup |
| Auto-update | GitHub releases download |

### 2.3 Database (Prisma)

- **Computer** — hostname, IP, MAC, OS, department
- **Report** — metrics (JSON strings)
- **Alert** — type, severity, message, resolved
- **Message** — agent → IT
- **Command** — remote actions queue
- **ServerMessage** — IT → agent
- **Program** — downloadable files

---

## 3. ຂໍ້ດີ (Strengths)

1. **ຄົບຖ້ວນ** — ເກັບຂໍ້ມູນ Windows ໄດ້ຫຼາຍ (17 collectors)
2. **Remote Actions** — ສັ່ງ restart, shutdown, screenshot ຈາກ dashboard
3. **Two-way Communication** — Agent ↔ Server ສື່ສານສອງທາງ
4. **Dark Theme UI** — Dashboard ງາມ, ໃຊ້ Tailwind v4
5. **Auto Alert** — alert ອັດຕະໂນມັດ + deduplication + auto-resolve
6. **Installer + Portable** — ມີທັງ 2 ແບບ
7. **CI/CD** — GitHub Actions build ອັດຕະໂນມັດ
8. **Offline Resilience** — Agent ເກັບ report offline
9. **System Tray** — Tray icon + context menu

---

## 4. ຂໍ້ເສຍ ແລະ ບັນຫາ (Weaknesses)

### 4.1 Security 🔴

| ບັນຫາ | ລາຍລະອຽດ |
|--------|-----------|
| ບໍ່ມີ Authentication | Dashboard ບໍ່ມີ login |
| API Key ງ່າຍ | Hardcoded key, ບໍ່ມີ rotation |
| Remote PowerShell | ອະນຸຍາດ arbitrary code execution |
| ບໍ່ມີ HTTPS | HTTP (ยອมຮັບໄດ້ ເພາະ LAN ພາຍໃນ) |
| No Rate Limit | API ບໍ່ມີ rate limiting |

### 4.2 Performance 🟡

| ບັນຫາ | ລາຍລະອຽດ |
|--------|-----------|
| SQLite | ບໍ່ເໝາະກັບ concurrent writes ຫຼາຍ agents → ຍ້າຍ MySQL |
| Polling Model | ບໍ່ realtime |
| socket.io ບໍ່ໄດ້ໃຊ້ | ຕິດຕັ້ງແລ້ວແຕ່ບໍ່ implement |
| ບໍ່ມີ pagination | Load ທັງໝົດ |
| JSON String fields | ບໍ່ query ໄດ້ |

### 4.3 Code Quality 🟡

| ບັນຫາ | ລາຍລະອຽດ |
|--------|-----------|
| Duplicated Prisma | `lib/db.ts` ແລະ `lib/prisma.ts` |
| Duplicated update | `self_update.py` ແລະ `updater.py` |
| Page ໃຫຍ່ | `computers/[id]/page.tsx` = 1274 ແຖວ |
| No tests | ບໍ່ມີ unit/integration tests |
| Hardcoded thresholds | CPU>90%, RAM>85% hardcoded |

### 4.4 UX 🟡

| ບັນຫາ | ລາຍລະອຽດ |
|--------|-----------|
| ບໍ່ມີ Notification | ບໍ່ມີ browser notification |
| ບໍ່ responsive | Sidebar ບໍ່ collapse |
| ໃຊ້ alert() | ບໍ່ມີ toast notification |

### 4.5 Infrastructure 🟡

| ບັນຫາ | ລາຍລະອຽດ |
|--------|-----------|
| No backup | ບໍ່ມີ DB backup (mysqldump) |
| Log rotation | Agent logs ບໍ່ rotate |

---

## 5. ເຄື່ອງມືທີ່ແນະນຳ

| Library | ໜ້າທີ່ | Phase |
|---------|--------|-------|
| MySQL | Production DB (ແທນ SQLite) | 1 |
| NextAuth.js | Authentication | 1 |
| zod | API validation | 1 |
| sonner | Toast notifications | 1 |
| @tanstack/react-query | Data fetching & caching | 2 |
| socket.io | Realtime updates (ຕິດຕັ້ງແລ້ວ) | 2 |
| jsPDF | PDF export | 2 |
| Vitest | Testing | 2 |
| next-intl | i18n (ລາວ/English) | 3 |

---

## 6. ແຜນການປັບປຸງ (Roadmap)

### Phase 1: Database + Security + Foundation (1-2 ອາທິດ)

#### 1.1 MySQL Migration
- [ ] ຕິດຕັ້ງ MySQL server ໃນ LAN
- [ ] ປ່ຽນ Prisma provider `sqlite` → `mysql`
- [ ] ປັບ schema (String → VARCHAR, DateTime defaults, etc.)
- [ ] ສ້າງ `.env` ສຳລັບ `DATABASE_URL`
- [ ] Migrate ຂໍ້ມູນເກົ່າ (ຖ້າມີ)

#### 1.2 Authentication
- [ ] ເພີ່ມ admin login (NextAuth.js credentials)
- [ ] ສ້າງ User model (username, password hash, role)
- [ ] ປ້ອງກັນ dashboard routes ດ້ວຍ middleware
- [ ] ສ້າງ login page UI

#### 1.3 API Security
- [ ] Per-agent API keys (ແຕ່ລະເຄື່ອງມີ key ແຍກ)
- [ ] zod validation ສຳລັບ request bodies
- [ ] Auth check ສຳລັບ command creation

#### 1.4 Code Cleanup
- [ ] ລວມ `lib/db.ts` + `lib/prisma.ts` → ໃຊ້ import ດຽວ
- [ ] ລຶບ `self_update.py` (ໃຊ້ `updater.py` ແທນ)
- [ ] ແຍກ `computers/[id]/page.tsx` ເປັນ components ຍ່ອຍ

#### 1.5 UX
- [ ] Toast notifications (sonner)
- [ ] Loading skeletons ແທນ spinners
- [ ] Error boundary ໃນ layout
- [ ] Responsive sidebar (collapse ໃນ mobile)

#### 1.6 Agent
- [ ] Log rotation (RotatingFileHandler, 5MB × 3 files)
- [ ] Fix offline_reports directory → ໃຊ້ AppData

---

### Phase 2: Performance + Features (2-3 ອາທິດ)

#### 2.1 Realtime
- [x] Implement socket.io (ຕິດຕັ້ງແລ້ວ)
- [x] Live dashboard updates
- [x] Live command status

#### 2.2 Performance
- [x] Pagination (computers, alerts, messages)
- [x] React Query caching
- [x] Optimize report payload (ສົ່ງສະເພາະ changed data)

#### 2.3 Features
- [x] Browser notifications ເວລາ alert ໃໝ່
- [x] Custom alert thresholds (admin ຕັ້ງເອງ)
- [x] Agent groups/tags (ຕຶກ, ຫ້ອງ, ชັ້ນ)
- [x] PDF export ລາຍລະອຽດເຄື່ອງ
- [x] Audit log (ບັນທຶກ admin actions)

#### 2.4 Testing
- [ ] Vitest setup
- [ ] API route tests
- [ ] Agent collector tests

---

### Phase 3: Production + Polish (2-3 ອາທິດ)

#### 3.1 Database
- [ ] Backup strategy (mysqldump ອັດຕະໂນມັດ)
- [ ] Report retention policy (ລຶບ report ເກົ່າ)

#### 3.2 Infrastructure
- [ ] Health check endpoint `/api/health`
- [ ] Windows service ສຳລັບ server
- [ ] ເຄື່ອງມື deploy ພາຍໃນ LAN

#### 3.3 Features
- [ ] i18n (ລາວ/English)
- [ ] Dark/Light theme toggle
- [ ] Scheduled reports (ສົ່ງ summary ປະຈຳວັນ/ອາທິດ)

#### 3.4 Agent
- [ ] Service recovery options
- [ ] Update scheduling

---

## 7. Priority Matrix

| ລຳດັບ | ລາຍການ | ຜົນກະທົບ | ຄວາມຍາກ | Phase |
|-------|--------|----------|---------|-------|
| 1 | MySQL Migration | ສູງ | ກາງ | 1 |
| 2 | Admin Login | ສູງ | ກາງ | 1 |
| 3 | Per-agent API Keys | ສູງ | ກາງ | 1 |
| 4 | Code Cleanup | ກາງ | ຕ່ຳ | 1 |
| 5 | Toast + UX | ກາງ | ຕ່ຳ | 1 |
| 6 | Log Rotation | ກາງ | ຕ່ຳ | 1 |
| 7 | Socket.io Realtime | ສູງ | ສູງ | 2 |
| 8 | Pagination | ກາງ | ກາງ | 2 |
| 9 | Custom Thresholds | ກາງ | ກາງ | 2 |
| 10 | DB Backup | ກາງ | ຕ່ຳ | 3 |
| 11 | i18n | ກາງ | ກາງ | 3 |

---

## 8. ສະຫຼຸບ

ລະບົບ IT Monitor ໃຊ້ງານພາຍໃນ **LAN ວິທະຍາໄລ** ສຳລັບ monitoring Windows PCs. ຈຸດແຂງຫຼັກແມ່ນ **ການເກັບຂໍ້ມູນ 17 collectors** ແລະ **remote actions 17 ຄຳສັ່ງ**.

ບູລິມະສິດ Phase 1:
1. **MySQL** — ແທນ SQLite ເພື່ອຮອງຮັບ concurrent agents
2. **Admin Login** — ປ້ອງກັນ dashboard
3. **API Security** — per-agent keys
4. **Code Cleanup + UX** — ປັບປຸງ code ແລະ UI

HTTP ພໍແລ້ວ ເພາະ LAN ພາຍໃນ. ບໍ່ຈຳເປັນ Docker, Email, ຫຼື HTTPS.
