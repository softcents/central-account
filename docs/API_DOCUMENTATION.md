# REST API Documentation — SoftCents Billing Platform
**Base URL:** `https://account.softcents.com/api`  
**Internal Base URL:** `http://127.0.0.1:4000/api`  
**Web Endpoint Base:** `https://account.softcents.com/api`  
**Authentication:** Bearer JWT Token (`Authorization: Bearer <token>`) & Cookie-based Refresh Tokens  

---

## 1. Authentication & Security

### `POST /api/auth/login`
- **Description:** Authenticates client or administrator and returns JWT access token.
- **Request Body:**
  ```json
  {
    "email": "raju@softcents.com",
    "password": "SecurePassword123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "accessToken": "eyJhbGciOi...",
    "user": {
      "id": "usr_9921",
      "email": "raju@softcents.com",
      "status": "ACTIVE",
      "role": "SUPER_ADMIN"
    }
  }
  ```

### `POST /api/auth/register`
- **Description:** Onboards new customer. Creates user record and initializes customer profile.
- **Request Body:**
  ```json
  {
    "email": "newclient@gmail.com",
    "password": "StrongPassword!2026",
    "firstName": "Tanvir",
    "lastName": "Hasan",
    "phone": "01700000000"
  }
  ```

---

## 2. Payment Gateway & Checkout Engine

### `POST /api/payment/checkout`
- **Description:** Generates live PipraPay checkout URL for invoices, cart orders, and add-funds deposits.
- **Public:** Yes
- **Request Body:**
  ```json
  {
    "invoiceId": "464",
    "amount": 1500,
    "fullName": "Raju Ahmed",
    "email": "raju@softcents.com",
    "phone": "01711291696"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "pp_id": "660223614437408931946273729",
    "pp_url": "https://epay.softcents.com/payment/660223614437408931946273729"
  }
  ```

### `POST /api/payment/webhook`
- **Description:** Webhook receiver for PipraPay Instant Payment Notification (IPN).
- **Public:** Yes (Protected by PipraPay API verification)
- **Request Body:**
  ```json
  {
    "pp_id": "660223614437408931946273729",
    "status": "completed",
    "amount": 1500,
    "metadata": {
      "invoiceid": "464"
    }
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Payment verified and credited"
  }
  ```

---

## 3. Billing & Invoices

### `GET /api/billing/invoices/:tenantId`
- **Description:** Retrieves all invoices for a tenant/client.
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
  ```json
  [
    {
      "id": "INV-464",
      "amount": 1500.0,
      "currency": "BDT",
      "status": "PAID",
      "due_date": "2026-11-26T00:00:00.000Z",
      "created_at": "2026-11-19T00:00:00.000Z",
      "line_items": [
        {
          "description": "Standard Cloud VPS - 2 vCPU, 4GB RAM",
          "amount": 1500.0
        }
      ]
    }
  ]
  ```

### `GET /api/billing/invoices/detail/:invoiceId`
- **Description:** Fetches complete invoice with line items, tax, and payments.

---

## 4. Admin Management

### `GET /api/admin/users`
- **Description:** Paginated list of clients and tenant organizations.
- **Query Params:** `?page=1&limit=50&search=Raju`
- **Response:**
  ```json
  {
    "users": [
      {
        "id": "3",
        "email": "raju@softcents.com",
        "status": "ACTIVE",
        "profile": {
          "first_name": "Raju",
          "last_name": "Ahmed",
          "phone_number": "01711291696",
          "country_code": "BD"
        }
      }
    ],
    "pagination": { "total": 168, "page": 1, "limit": 50 }
  }
  ```

### `GET /api/admin/team`
- **Description:** Lists staff administrators, roles, and permission levels.

### `POST /api/admin/team`
- **Description:** Creates new administrator account.

---

## 5. Support Tickets

### `GET /api/support/tickets`
- **Description:** Retrieves support tickets filtered by user or department.
- **Response:**
  ```json
  [
    {
      "id": "tkt_whmcs_29",
      "subject": "rDNS and PTR record setup request",
      "status": "OPEN",
      "priority": "HIGH",
      "category": "GENERAL_SUPPORT",
      "created_at": "2026-11-19T22:15:00.000Z"
    }
  ]
  ```

---

## 6. Identity Verification (KYC / NID)

### `GET /api/v1/kyc/:userId`
- **Description:** Returns NID verification status, OCR document text, and face match similarity.
- **Response:**
  ```json
  {
    "status": "VERIFIED",
    "documentType": "NID",
    "faceSimilarityScore": 0.98,
    "reviewedAt": "2026-10-15T12:00:00.000Z"
  }
  ```
