# Alert docs

**Base URL:** `http://localhost:3000`  
**Base Path:** `/alerts`

## 📡 API Endpoints

### 1. Get All Unresolved Alerts

Get list of all unresolved alerts (summary only).

**Endpoint:** `GET /alerts`

**Request:**

```http
GET /alerts
Authorization: Bearer <token>
```

**Response 200:**

```json
{
  "status": "success",
  "message": "Alerts summary retrieved successfully",
  "data": [
    {
      "id": 125,
      "machine_id": "M_H_09",
      "type": "ML_FAILURE_PREDICTED",
      "severity": "high",
      "message_preview": "Machine failure predicted with 89% confidence. Immediate maintenance required...",
      "created_at": "2025-12-12T09:00:00.000Z"
    },
    {
      "id": 126,
      "machine_id": "M_H_12",
      "type": "ML_TOOL_WEAR_WARNING",
      "severity": "medium",
      "message_preview": "Tool wear level at 85%. Consider scheduling maintenance...",
      "created_at": "2025-12-12T09:15:00.000Z"
    }
  ]
}
```

**Notes:**

- Hanya return alerts dengan `resolved = false`
- Message dipotong ke 150 karakter (dengan `...`)
- Sorted by `created_at DESC` (terbaru dulu)

---

### 2. Get Alert by ID

Get full details of specific alert including ML diagnostics.

**Endpoint:** `GET /alerts/:id`

**Request:**

```http
GET /alerts/125
Authorization: Bearer <token>
```

**Response 200:**

```json
{
  "status": "success",
  "message": "Alert retrieved successfully",
  "data": {
    "id": 125,
    "machine_id": "M_H_09",
    "type": "ML_FAILURE_PREDICTED",
    "severity": "high",
    "message": "Machine failure predicted with 89% confidence. Immediate maintenance required based on multiple anomaly indicators.",
    "data": {
      "prediction": "FAILURE",
      "confidence": 0.89,
      "overall_health": 0.45,
      "diagnostics": {
        "severity": "HIGH",
        "condition": "Critical maintenance required",
        "anomalies": [
          {
            "type": "tool_wear",
            "severity": "HIGH",
            "value": 200,
            "threshold": 180,
            "description": "Tool wear exceeds safe operating limits"
          },
          {
            "type": "temperature",
            "severity": "MEDIUM",
            "value": 312,
            "normal_range": "295-310",
            "description": "Process temperature elevated"
          }
        ],
        "recommendations": [
          "Immediate tool inspection and replacement recommended",
          "Check cooling system efficiency",
          "Schedule comprehensive maintenance within 24 hours"
        ]
      },
      "raw_data": {
        "air_temperature": 301.5,
        "process_temperature": 312.4,
        "rotational_speed": 1420,
        "torque": 45.2,
        "tool_wear": 200
      }
    },
    "resolved": false,
    "resolved_at": null,
    "resolved_by": null,
    "created_at": "2025-12-12T09:00:00.000Z",
    "updated_at": "2025-12-12T09:00:00.000Z"
  }
}
```

**Response 404:**

```json
{
  "status": "error",
  "message": "Alert not found"
}
```

**Response 400:**

```json
{
  "status": "error",
  "message": "Valid alert ID is required"
}
```

---

### 3. Get Alerts by Severity

Filter alerts by severity level.

**Endpoint:** `GET /alerts/severity/:severity`

**Valid severity values:** `low`, `medium`, `high`, `critical`

**Request:**

```http
GET /alerts/severity/critical
Authorization: Bearer <token>
```

**Response 200:**

```json
{
  "status": "success",
  "message": "critical severity alerts retrieved successfully",
  "data": [
    {
      "id": 127,
      "machine_id": "M_L_05",
      "type": "ML_FAILURE_PREDICTED",
      "severity": "critical",
      "message": "Imminent machine failure detected...",
      "data": {
        /* full ML data */
      },
      "resolved": false,
      "created_at": "2025-12-12T10:00:00.000Z"
    }
  ]
}
```

**Response 400:**

```json
{
  "status": "error",
  "message": "Valid severity level is required (low, medium, high, critical)"
}
```

---

### 4. Get Alert Statistics

Get comprehensive statistics about alerts.

**Endpoint:** `GET /alerts/stats`

**Request:**

```http
GET /alerts/stats
Authorization: Bearer <token>
```

**Response 200:**

```json
{
  "status": "success",
  "message": "Alert statistics retrieved successfully",
  "data": {
    "total": 150,
    "unresolved": 25,
    "resolved": 125,
    "bySeverity": {
      "low": 30,
      "medium": 60,
      "high": 45,
      "critical": 15
    },
    "unresolvedBySeverity": {
      "low": 5,
      "medium": 8,
      "high": 10,
      "critical": 2
    }
  }
}
```

**Description:**

- `total` - Total alerts (resolved + unresolved)
- `unresolved` - Alerts yang belum di-handle
- `resolved` - Alerts yang sudah di-handle
- `bySeverity` - Breakdown semua alerts by severity
- `unresolvedBySeverity` - Breakdown unresolved alerts by severity

---

### 5. generate alert

alert di generate ketika call api machine/condition
dibatasi duplikasi jika alert serupa sudah ada dalam 1 jam terakhir

### 6. Resolve Alert

Mark alert as resolved (handled by engineer).

**Endpoint:** `PATCH /alerts/:id/resolve`

**Request:**

```http
PATCH /alerts/125/resolve
Authorization: Bearer <token>
Content-Type: application/json

{
  "resolved_by": "engineer.john@company.com"
}
```

**Body Parameters:**

- `resolved_by` (string, optional) - User email/ID yang resolve
  - Jika tidak disediakan, akan gunakan `req.user.email` atau `req.user.id`
  - Jika auth data tidak ada, default: `"unknown"`

**Response 200:**

```json
{
  "status": "success",
  "message": "Alert resolved successfully",
  "data": {
    "id": 125,
    "machine_id": "M_H_09",
    "type": "ML_FAILURE_PREDICTED",
    "severity": "high",
    "message": "Machine failure predicted...",
    "data": {
      /* ... */
    },
    "resolved": true,
    "resolved_at": "2025-12-12T12:00:00.000Z",
    "resolved_by": "engineer.john@company.com",
    "created_at": "2025-12-12T09:00:00.000Z",
    "updated_at": "2025-12-12T12:00:00.000Z"
  }
}
```

**Response 400 - Already Resolved:**

```json
{
  "status": "error",
  "message": "Alert is already resolved",
  "data": {
    "resolved_at": "2025-12-12T12:00:00.000Z",
    "resolved_by": "engineer.john@company.com"
  }
}
```

**Response 404:**

```json
{
  "status": "error",
  "message": "Alert not found"
}
```

**Notes:**

- Alert yang resolved tidak akan muncul di `GET /alerts` (list)
- Alert masih bisa diakses via `GET /alerts/:id` untuk audit trail
- Action ini **tidak menghapus** alert, hanya update status

---
