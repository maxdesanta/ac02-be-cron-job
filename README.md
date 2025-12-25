## 🚀 **Quick Start**

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env dengan konfigurasi database Anda

# 3. Setup database
npm run migrate:up

# 4. seed data
npm run db:seed

# 5. Start server
npm run start:dev
```

## 📡 **API Endpoints**

### **Engine Management**

```
GET    /api/machines                        - Get all machines
GET    /api/machines/:id                    - Get machines by ID
GET    /api/machines/type/:type             - Get machines by type
GET    /api/machines/risk/:risk             - Get machines by risk
GET    /api/machines/severity/:severity     - Get machines by severity
GET    /api/machines/search                 - Search machines by name
GET    /api/machines/statistic              - get total machines
```

### **Auth Management**

```
POST    /register      - Register account
POST    /login         - Login account
GET     /profile       - Check profile
```

### **Message Chatbot**

```
POST    /generate      - Write prompt
GET     /message       - Get history message
```

### **ALERT Management**

```
Please check the ALERT_API_DOCS.md files
```

## 📦 **Scripts**

| Command                | Description                 |
| ---------------------- | --------------------------- |
| `npm start`            | Start production server     |
| `npm run start:dev`    | Start development server    |
| `npm run migrate:up`   | Run migrations              |
| `npm run migrate:down` | Rollback migrations         |
| `npm run db:seed`      | seed data mesin             |

## 🔧 **Development**

### **Environment Variables**

```env
Please check on .env.example files
```
