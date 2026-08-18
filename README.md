# MindX LMS Odoo Ticket Agent

He thong quan ly va bao cao ticket LMS tu Odoo Helpdesk.

## Tinh nang

- **Crawl ticket**: Lay thong tin ticket tu Odoo
- **Reply ticket**: Tra loi ticket tren Odoo
- **Resolve ticket**: Danh dau ticket da xu ly
- **Check assignee**: Kiem tra nguoi duoc phan cong
- **Note ticket**: Them ghi chu noi bo
- **Bao cao**: Tao bao cao theo tuan/thang voi thong ke chi tiet

## Cau truc

```
mindx-agent-lms-odoo/
├── .env                 # Bi moi truong (khong commit)
├── .env.example         # Mau bi moi truong
├── AGENTS.md            # Huong dan agent
├── package.json         # Cau hinh package
├── tsconfig.base.json   # Cau hinh TypeScript
├── odoo-auto-cli/       # Odoo XML-RPC helpers
│   └── src/
│       ├── index.ts     # CLI entry point
│       └── helpers.ts   # Ham ket noi Odoo
├── scripts/             # Script bao cao
│   └── report.ts        # Script tao bao cao
└── reports/             # Thu muc bao cao
    └── YYYY-MM/         # Bao cao theo thang
        └── lms-report-weekN.md
```

## Cai dat

```bash
# Install dependencies
npm install

# Copy .env.example to .env
cp .env.example .env

# Edit .env with your Odoo credentials
```

## Su dung

### Ticket Operations

```bash
# Crawl ticket
npx tsx odoo-auto-cli/src/index.ts crawl-ticket -t <ticket_id>

# Reply to ticket
npx tsx odoo-auto-cli/src/index.ts reply-ticket -t <ticket_id> --template <file>

# Mark ticket as solved
npx tsx odoo-auto-cli/src/index.ts resolve-ticket -t <ticket_id>

# Check assignee
npx tsx odoo-auto-cli/src/index.ts check-assignee -t <ticket_id>

# Add internal note
npx tsx odoo-auto-cli/src/index.ts note-ticket -t <ticket_id> -m "message"
```

### Bao cao

```bash
# Bao cao ca thang
npx tsx scripts/report.ts <month> <year>

# Bao cao theo tuan
npx tsx scripts/report.ts <month> <year> <weekStart> <weekEnd>

# Vi du
npx tsx scripts/report.ts 7 2026          # Thang 8/2026, ca thang
npx tsx scripts/report.ts 7 2026 1 2      # Thang 8/2026, tuan 1-2
```

## Dinh dang bao cao

Bao cao duoc luu trong`reports/YYYY-MM/lms-report-weekN.md` voi cau truc:

- **Tong quan**: So luong ticket mo/dong
- **Thong ke theo Tags**: Phan tich theo tung tag (sap xep theo so luong)
- **Phan thoi gian xu ly**: Khung gio 0h-8h, 8h-24h, 24h-48h, >48h
- **Dang xu ly**: Danh sach ticket dang xu ly
- **Da dong**: Danh sach ticket da dong
- **Ket luan**: Tong ket tuan

## Lich tuan

- **Tuan bat dau**: Thu 7 (Saturday)
- **Tuan ket thuc**: Thu 6 (Friday)
- **Tinh dong theo thang**: Mo thang bat dau lai tu 1

Vi du thang 8/2026:
- Tuan 1: 1/8 - 7/8
- Tuan 2: 8/8 - 14/8
- Tuan 3: 15/8 - 21/8
- Tuan 4: 22/8 - 28/8
- Tuan 5: 29/8 - 31/8

## Odoo Stages

**Team LMS (ID: 10)**

| Stage | Trang thai |
|-------|------------|
| New | Mo |
| In Progress | Mo |
| On Hold | Mo |
| Solved | Dong |
| Closed | Dong |
| Cancelled | Dong |

## Moi truong

| Bien | Mo ta |
|------|-------|
| `URL` | Odoo URL (https://hrm.mindx.edu.vn) |
| `DB` | Database name |
| `USER_NAME` | Username |
| `API_KEY` | API key |

## License

Private - MindX Education
