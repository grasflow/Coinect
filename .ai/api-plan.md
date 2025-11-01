# REST API Plan - Coinect MVP

## Overview

This API plan leverages Supabase as the primary backend service, combining:

- **Supabase Auth** for authentication and authorization
- **Supabase PostgREST** for auto-generated CRUD operations on database tables
- **Custom Astro API endpoints** for complex business logic

All API endpoints require authentication unless explicitly stated otherwise. The API uses JWT tokens provided by Supabase Auth.

---

## 1. Resources

| Resource     | Database Table        | Description                            |
| ------------ | --------------------- | -------------------------------------- |
| Profile      | `profiles`            | User profile and invoice issuer data   |
| Client       | `clients`             | Freelancer's clients                   |
| TimeEntry    | `time_entries`        | Time tracking entries                  |
| Invoice      | `invoices`            | Generated invoices                     |
| InvoiceItem  | `invoice_items`       | Line items on invoices                 |
| AIInsight    | `ai_insights_data`    | Aggregated data for AI analysis        |
| ExchangeRate | `exchange_rate_cache` | Cached currency exchange rates         |

---

## 2. Authentication Endpoints

### 2.1. Register User

**Endpoint:** `POST /auth/v1/signup`  
**Provider:** Supabase Auth  
**Description:** Register a new user and create their profile

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "data": {
    "full_name": "Jan Kowalski"
  }
}
```

**Success Response (200):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "user_metadata": {
      "full_name": "Jan Kowalski"
    }
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_in": 3600
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid email format or weak password
- `422 Unprocessable Entity` - Email already exists

**Business Logic:**

- Trigger automatically creates profile entry in `profiles` table
- Password must be minimum 8 characters with letter and digit
- Email must be unique

---

### 2.2. Login User

**Endpoint:** `POST /auth/v1/token?grant_type=password`  
**Provider:** Supabase Auth  
**Description:** Authenticate user and return session tokens

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**

```json
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid credentials
- `401 Unauthorized` - Authentication failed

---

### 2.3. Logout User

**Endpoint:** `POST /auth/v1/logout`  
**Provider:** Supabase Auth  
**Description:** Invalidate user session

**Headers:**

```
Authorization: Bearer {access_token}
```

**Success Response (204):**
No content

---

### 2.4. Refresh Token

**Endpoint:** `POST /auth/v1/token?grant_type=refresh_token`  
**Provider:** Supabase Auth  
**Description:** Refresh access token using refresh token

**Request Body:**

```json
{
  "refresh_token": "refresh_token"
}
```

**Success Response (200):**

```json
{
  "access_token": "new_jwt_token",
  "refresh_token": "new_refresh_token",
  "expires_in": 3600
}
```

---

## 3. Profile Endpoints

### 3.1. Get Current User Profile

**Endpoint:** `GET /rest/v1/profiles?id=eq.{user_id}`  
**Provider:** Supabase PostgREST  
**Description:** Retrieve current user's profile

**Headers:**

```
Authorization: Bearer {access_token}
apikey: {supabase_anon_key}
```

**Success Response (200):**

```json
[
  {
    "id": "uuid",
    "full_name": "Jan Kowalski",
    "tax_id": "1234567890",
    "street": "ul. Przykładowa 1",
    "city": "Warszawa",
    "postal_code": "00-001",
    "country": "Polska",
    "email": "jan@example.com",
    "phone": "+48123456789",
    "bank_account": "12 3456 7890 1234 5678 9012 3456",
    "logo_url": "https://storage.url/logo.png",
    "accent_color": "#2563EB",
    "onboarding_completed": false,
    "onboarding_step": 1,
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z"
  }
]
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User cannot access this profile

---

### 3.2. Update Profile

**Endpoint:** `PATCH /rest/v1/profiles?id=eq.{user_id}`  
**Provider:** Supabase PostgREST  
**Description:** Update user's profile information

**Headers:**

```
Authorization: Bearer {access_token}
apikey: {supabase_anon_key}
Content-Type: application/json
Prefer: return=representation
```

**Request Body:**

```json
{
  "full_name": "Jan Kowalski",
  "tax_id": "1234567890",
  "street": "ul. Nowa 15",
  "city": "Kraków",
  "postal_code": "30-001",
  "email": "jan.kowalski@example.com",
  "phone": "+48987654321",
  "bank_account": "98 7654 3210 9876 5432 1098 7654",
  "accent_color": "#1E40AF"
}
```

**Success Response (200):**

```json
[
  {
    "id": "uuid",
    "full_name": "Jan Kowalski",
    "tax_id": "1234567890",
    "street": "ul. Nowa 15",
    "city": "Kraków",
    "postal_code": "30-001",
    "country": "Polska",
    "email": "jan.kowalski@example.com",
    "phone": "+48987654321",
    "bank_account": "98 7654 3210 9876 5432 1098 7654",
    "logo_url": "https://storage.url/logo.png",
    "accent_color": "#1E40AF",
    "onboarding_completed": false,
    "onboarding_step": 1,
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-15T14:30:00Z"
  }
]
```

**Error Responses:**

- `400 Bad Request` - Invalid data format
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User cannot update this profile

**Validation:**

- `tax_id` must be 10 digits (if provided)
- `accent_color` must be valid HEX color format
- `email` must be valid email format

---

### 3.3. Update Onboarding Progress

**Endpoint:** `PATCH /rest/v1/profiles?id=eq.{user_id}`  
**Provider:** Supabase PostgREST  
**Description:** Update onboarding step or mark as completed

**Request Body:**

```json
{
  "onboarding_step": 2,
  "onboarding_completed": false
}
```

**Success Response (200):**

```json
[
  {
    "id": "uuid",
    "onboarding_step": 2,
    "onboarding_completed": false,
    "updated_at": "2025-01-15T14:30:00Z"
  }
]
```

---

### 3.4. Upload Logo

**Endpoint:** `POST /api/profile/upload-logo`  
**Provider:** Custom Astro API  
**Description:** Upload user logo to Supabase Storage

**Headers:**

```
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

**Request Body:**

```
logo: [file] (PNG or JPG, max 2MB)
```

**Success Response (200):**

```json
{
  "logo_url": "https://storage.supabase.co/user-logos/uuid/logo.png",
  "message": "Logo uploaded successfully"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid file format or size exceeds 2MB
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Upload failed

**Validation:**

- File must be PNG or JPG
- Maximum size: 2MB
- Automatically scales to appropriate size

---

## 4. Client Endpoints

### 4.1. List Clients

**Endpoint:** `GET /rest/v1/clients`  
**Provider:** Supabase PostgREST  
**Description:** Get all clients for current user with optional filtering and sorting

**Headers:**

```
Authorization: Bearer {access_token}
apikey: {supabase_anon_key}
```

**Query Parameters:**

- `name=ilike.*{search}*` - Search by client name
- `tax_id=ilike.*{search}*` - Search by NIP
- `order=name.asc` - Sort by name (asc/desc)
- `order=created_at.desc` - Sort by creation date
- `limit=50` - Pagination limit
- `offset=0` - Pagination offset

**Success Response (200):**

```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Acme Corp",
    "tax_id": "1234567890",
    "street": "ul. Biznesowa 10",
    "city": "Warszawa",
    "postal_code": "00-001",
    "country": "Polska",
    "email": "contact@acme.com",
    "phone": "+48111222333",
    "default_currency": "PLN",
    "default_hourly_rate": "150.00",
    "deleted_at": null,
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z"
  }
]
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token

---

### 4.2. Get Client by ID

**Endpoint:** `GET /rest/v1/clients?id=eq.{client_id}`  
**Provider:** Supabase PostgREST  
**Description:** Get specific client details

**Headers:**

```
Authorization: Bearer {access_token}
apikey: {supabase_anon_key}
```

**Success Response (200):**

```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Acme Corp",
    "tax_id": "1234567890",
    "street": "ul. Biznesowa 10",
    "city": "Warszawa",
    "postal_code": "00-001",
    "country": "Polska",
    "email": "contact@acme.com",
    "phone": "+48111222333",
    "default_currency": "PLN",
    "default_hourly_rate": "150.00",
    "deleted_at": null,
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z"
  }
]
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Client belongs to different user
- `404 Not Found` - Client not found

---

### 4.3. Create Client

**Endpoint:** `POST /rest/v1/clients`  
**Provider:** Supabase PostgREST  
**Description:** Create new client

**Headers:**

```
Authorization: Bearer {access_token}
apikey: {supabase_anon_key}
Content-Type: application/json
Prefer: return=representation
```

**Request Body:**

```json
{
  "name": "Acme Corp",
  "tax_id": "1234567890",
  "street": "ul. Biznesowa 10",
  "city": "Warszawa",
  "postal_code": "00-001",
  "country": "Polska",
  "email": "contact@acme.com",
  "phone": "+48111222333",
  "default_currency": "PLN",
  "default_hourly_rate": "150.00"
}
```

**Success Response (201):**

```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Acme Corp",
    "tax_id": "1234567890",
    "street": "ul. Biznesowa 10",
    "city": "Warszawa",
    "postal_code": "00-001",
    "country": "Polska",
    "email": "contact@acme.com",
    "phone": "+48111222333",
    "default_currency": "PLN",
    "default_hourly_rate": "150.00",
    "deleted_at": null,
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-01-15T10:00:00Z"
  }
]
```

**Error Responses:**

- `400 Bad Request` - Invalid data or missing required fields
- `401 Unauthorized` - Missing or invalid token
- `409 Conflict` - Client with same name already exists for this user

**Validation:**

- `name` is required
- `tax_id` must be 10 digits (if provided)
- `email` must be valid email format (if provided)
- `default_currency` must be one of: PLN, EUR, USD
- `default_hourly_rate` must be >= 0

---

### 4.4. Update Client

**Endpoint:** `PATCH /rest/v1/clients?id=eq.{client_id}`  
**Provider:** Supabase PostgREST  
**Description:** Update client information

**Headers:**

```
Authorization: Bearer {access_token}
apikey: {supabase_anon_key}
Content-Type: application/json
Prefer: return=representation
```

**Request Body:**

```json
{
  "name": "Acme Corporation",
  "default_hourly_rate": "175.00"
}
```

**Success Response (200):**

```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Acme Corporation",
    "tax_id": "1234567890",
    "street": "ul. Biznesowa 10",
    "city": "Warszawa",
    "postal_code": "00-001",
    "country": "Polska",
    "email": "contact@acme.com",
    "phone": "+48111222333",
    "default_currency": "PLN",
    "default_hourly_rate": "175.00",
    "deleted_at": null,
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-01-20T14:30:00Z"
  }
]
```

**Error Responses:**

- `400 Bad Request` - Invalid data format
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Client belongs to different user
- `404 Not Found` - Client not found

**Business Logic:**

- Changing hourly rate does NOT affect existing time entries or invoices
- Only fields included in request body are updated

---

### 4.5. Delete Client (Soft Delete)

**Endpoint:** `PATCH /rest/v1/clients?id=eq.{client_id}`  
**Provider:** Supabase PostgREST  
**Description:** Soft delete a client

**Headers:**

```
Authorization: Bearer {access_token}
apikey: {supabase_anon_key}
Content-Type: application/json
```

**Request Body:**

```json
{
  "deleted_at": "2025-01-20T15:00:00Z"
}
```

**Success Response (204):**
No content

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Client belongs to different user
- `404 Not Found` - Client not found
- `409 Conflict` - Client has associated time entries or invoices (enforced by RESTRICT)

**Business Logic:**

- Cannot delete client with existing time entries or invoices (database RESTRICT constraint)
- Sets `deleted_at` timestamp instead of physical deletion
- Deleted clients are filtered out by RLS policies

---

### 4.6. Get Client Statistics

**Endpoint:** `GET /api/clients/{client_id}/stats`  
**Provider:** Custom Astro API  
**Description:** Get aggregated statistics for a client

**Headers:**

```
Authorization: Bearer {access_token}
```

**Success Response (200):**

```json
{
  "client_id": "uuid",
  "total_hours": "245.50",
  "total_invoices": 12,
  "total_revenue": "36825.00",
  "currency": "PLN",
  "unbilled_hours": "18.00",
  "unbilled_amount": "2700.00",
  "last_invoice_date": "2025-01-15",
  "average_hourly_rate": "150.00"
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Client belongs to different user
- `404 Not Found` - Client not found

---

## 5. Time Entry Endpoints

### 5.1. List Time Entries

**Endpoint:** `GET /rest/v1/time_entries`
**Provider:** Supabase PostgREST
**Description:** Get all time entries for current user with filtering

**Headers:**

```
Authorization: Bearer {access_token}
apikey: {supabase_anon_key}
```

**Query Parameters:**

- `client_id=eq.{uuid}` - Filter by client
- `date=gte.{date}` - Filter by date range (from)
- `date=lte.{date}` - Filter by date range (to)
- `invoice_id=is.null` - Filter unbilled entries
- `invoice_id=not.is.null` - Filter billed entries
- `order=date.desc` - Sort by date
- `select=*,client:clients(name)` - Include relations
- `limit=50` - Pagination limit
- `offset=0` - Pagination offset

**Success Response (200):**

```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "client_id": "uuid",
    "date": "2025-01-15",
    "hours": "8.00",
    "hourly_rate": "150.00",
    "currency": "PLN",
    "public_description": "Backend development",
    "private_note": "Lots of scope changes, client was unprepared",
    "invoice_id": null,
    "deleted_at": null,
    "created_at": "2025-01-15T18:00:00Z",
    "updated_at": "2025-01-15T18:00:00Z",
    "client": {
      "name": "Acme Corp"
    }
  }
]
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token

---

### 5.2. Get Time Entry by ID

**Endpoint:** `GET /rest/v1/time_entries?id=eq.{entry_id}`
**Provider:** Supabase PostgREST
**Description:** Get specific time entry details

**Headers:**

```
Authorization: Bearer {access_token}
apikey: {supabase_anon_key}
```

**Query Parameters:**

- `select=*,client:clients(*)` - Include full relations

**Success Response (200):**

```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "client_id": "uuid",
    "date": "2025-01-15",
    "hours": "8.00",
    "hourly_rate": "150.00",
    "currency": "PLN",
    "public_description": "Backend development",
    "private_note": "Lots of scope changes, client was unprepared",
    "invoice_id": null,
    "deleted_at": null,
    "created_at": "2025-01-15T18:00:00Z",
    "updated_at": "2025-01-15T18:00:00Z",
    "client": {
      "id": "uuid",
      "name": "Acme Corp",
      "default_currency": "PLN",
      "default_hourly_rate": "150.00"
    }
  }
]
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Entry belongs to different user
- `404 Not Found` - Entry not found

---

### 5.3. Create Time Entry

**Endpoint:** `POST /api/time-entries`
**Provider:** Custom Astro API
**Description:** Create new time entry

**Headers:**

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "client_id": "uuid",
  "date": "2025-01-15",
  "hours": 8.0,
  "hourly_rate": 150.0,
  "currency": "PLN",
  "public_description": "Backend development",
  "private_note": "Lots of scope changes"
}
```

**Success Response (201):**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "client_id": "uuid",
  "date": "2025-01-15",
  "hours": "8.00",
  "hourly_rate": "150.00",
  "currency": "PLN",
  "public_description": "Backend development",
  "private_note": "Lots of scope changes",
  "invoice_id": null,
  "deleted_at": null,
  "created_at": "2025-01-15T18:00:00Z",
  "updated_at": "2025-01-15T18:00:00Z"
}
```

**Error Responses:**

- `400 Bad Request` - Missing required fields or invalid data
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Client belongs to different user
- `404 Not Found` - Client not found

**Validation:**

- `client_id` is required
- `hours` is required and must be > 0
- `hourly_rate` is required and must be >= 0
- `currency` must be one of: PLN, EUR, USD
- If `hourly_rate` not provided, use client's `default_hourly_rate`
- If `currency` not provided, use client's `default_currency`

**Business Logic:**

- Creates time entry in `time_entries` table
- Triggers automatic sync to `ai_insights_data` if `private_note` is present

---

### 5.4. Update Time Entry

**Endpoint:** `PUT /api/time-entries/{entry_id}`
**Provider:** Custom Astro API
**Description:** Update time entry

**Headers:**

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "date": "2025-01-15",
  "hours": 10.0,
  "hourly_rate": 150.0,
  "public_description": "Backend development and bug fixes",
  "private_note": "Lots of scope changes, extended to weekend"
}
```

**Success Response (200):**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "client_id": "uuid",
  "date": "2025-01-15",
  "hours": "10.00",
  "hourly_rate": "150.00",
  "currency": "PLN",
  "public_description": "Backend development and bug fixes",
  "private_note": "Lots of scope changes, extended to weekend",
  "invoice_id": null,
  "deleted_at": null,
  "created_at": "2025-01-15T18:00:00Z",
  "updated_at": "2025-01-15T20:30:00Z"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid data
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Entry belongs to different user OR entry is already invoiced
- `404 Not Found` - Entry not found

**Validation:**

- Same as Create Time Entry

**Business Logic:**

- Cannot update time entries that are already invoiced (`invoice_id IS NOT NULL`) - enforced by RLS
- Updates time entry fields
- Triggers update of `ai_insights_data`

---

### 5.5. Delete Time Entry (Soft Delete)

**Endpoint:** `PATCH /rest/v1/time_entries?id=eq.{entry_id}`
**Provider:** Supabase PostgREST
**Description:** Soft delete a time entry

**Headers:**

```
Authorization: Bearer {access_token}
apikey: {supabase_anon_key}
Content-Type: application/json
```

**Request Body:**

```json
{
  "deleted_at": "2025-01-20T15:00:00Z"
}
```

**Success Response (204):**
No content

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Entry belongs to different user OR entry is already invoiced
- `404 Not Found` - Entry not found

**Business Logic:**

- Cannot delete time entries that are already invoiced - enforced by RLS
- Sets `deleted_at` timestamp
- Deleted entries are filtered out by RLS policies

---

### 5.6. Get Unbilled Time Entries for Client

**Endpoint:** `GET /rest/v1/time_entries?client_id=eq.{client_id}&invoice_id=is.null`
**Provider:** Supabase PostgREST
**Description:** Get all unbilled time entries for a specific client

**Headers:**

```
Authorization: Bearer {access_token}
apikey: {supabase_anon_key}
```

**Query Parameters:**

- `select=*` - Select all fields
- `order=date.asc` - Sort by date ascending

**Success Response (200):**

```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "client_id": "uuid",
    "date": "2025-01-15",
    "hours": "8.00",
    "hourly_rate": "150.00",
    "currency": "PLN",
    "public_description": "Backend development",
    "private_note": "Scope changes",
    "invoice_id": null,
    "deleted_at": null,
    "created_at": "2025-01-15T18:00:00Z",
    "updated_at": "2025-01-15T18:00:00Z"
  }
]
```

---

### 5.7. Get Autocomplete Suggestions for Public Descriptions

**Endpoint:** `GET /api/time-entries/autocomplete?q={query}`
**Provider:** Custom Astro API
**Description:** Get unique public descriptions matching query

**Headers:**

```
Authorization: Bearer {access_token}
```

**Query Parameters:**

- `q` - Search query string (minimum 2 characters)
- `limit` - Maximum suggestions (default: 10)

**Success Response (200):**

```json
{
  "suggestions": ["Backend development", "Backend API integration", "Backend bug fixes"]
}
```

**Error Responses:**

- `400 Bad Request` - Query too short
- `401 Unauthorized` - Missing or invalid token

**Business Logic:**

- Returns unique `public_description` values from user's time entries
- Case-insensitive matching
- Sorted alphabetically
- Maximum 10 suggestions

---

### 5.8. Export Time Entries to CSV

**Endpoint:** `GET /api/time-entries/export`
**Provider:** Custom Astro API
**Description:** Export time entries to CSV file

**Headers:**

```
Authorization: Bearer {access_token}
```

**Query Parameters:**

- `client_id` - Filter by client (optional)
- `date_from` - Filter by date range from (optional)
- `date_to` - Filter by date range to (optional)
- `status` - Filter by status: all, billed, unbilled (optional)

**Success Response (200):**

```
Content-Type: text/csv
Content-Disposition: attachment; filename="coinect_time_entries_2025-01-20.csv"

Date,Client,Hours,Hourly Rate,Amount,Public Description,Status
2025-01-15,Acme Corp,8.00,150.00,1200.00,Backend development,Unbilled
2025-01-16,Acme Corp,6.50,150.00,975.00,API integration,Unbilled
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Export failed

**Business Logic:**

- Exports only time entries matching current filters
- Private notes are NOT included (privacy)
- File encoding: UTF-8 with BOM (for proper display of Polish characters in Excel)
- Filename format: `coinect_time_entries_YYYY-MM-DD.csv`

---

## 6. Invoice Endpoints

### 6.1. List Invoices

**Endpoint:** `GET /rest/v1/invoices`
**Provider:** Supabase PostgREST
**Description:** Get all invoices for current user with filtering

**Headers:**

```
Authorization: Bearer {access_token}
apikey: {supabase_anon_key}
```

**Query Parameters:**

- `client_id=eq.{uuid}` - Filter by client
- `issue_date=gte.{date}` - Filter by issue date (from)
- `issue_date=lte.{date}` - Filter by issue date (to)
- `status=eq.{status}` - Filter by status (paid/unpaid)
- `currency=eq.{currency}` - Filter by currency
- `order=issue_date.desc` - Sort by issue date
- `select=*,client:clients(name,tax_id)` - Include client info
- `limit=50` - Pagination limit
- `offset=0` - Pagination offset

**Success Response (200):**

```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "client_id": "uuid",
    "invoice_number": "INV/2025/001",
    "issue_date": "2025-01-15",
    "sale_date": "2025-01-15",
    "currency": "PLN",
    "exchange_rate": null,
    "exchange_rate_date": null,
    "is_custom_exchange_rate": false,
    "net_amount": "1200.00",
    "vat_rate": "23.00",
    "vat_amount": "276.00",
    "gross_amount": "1476.00",
    "net_amount_pln": null,
    "vat_amount_pln": null,
    "gross_amount_pln": null,
    "gross_amount_words": "jeden tysiąc czterysta siedemdziesiąt sześć złotych 00/100",
    "status": "unpaid",
    "is_paid": false,
    "is_imported": false,
    "is_edited": false,
    "edited_at": null,
    "pdf_url": "https://storage.url/invoices/uuid.pdf",
    "deleted_at": null,
    "created_at": "2025-01-15T12:00:00Z",
    "updated_at": "2025-01-15T12:00:00Z",
    "client": {
      "name": "Acme Corp",
      "tax_id": "1234567890"
    }
  }
]
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token

---

### 6.2. Get Invoice by ID

**Endpoint:** `GET /rest/v1/invoices?id=eq.{invoice_id}`  
**Provider:** Supabase PostgREST  
**Description:** Get specific invoice with all details

**Headers:**

```
Authorization: Bearer {access_token}
apikey: {supabase_anon_key}
```

**Query Parameters:**

- `select=*,client:clients(*),items:invoice_items(*,time_entries:invoice_item_time_entries(time_entry:time_entries(*)))` - Include full relations

**Success Response (200):**

```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "client_id": "uuid",
    "invoice_number": "INV/2025/001",
    "issue_date": "2025-01-15",
    "sale_date": "2025-01-15",
    "currency": "PLN",
    "exchange_rate": null,
    "exchange_rate_date": null,
    "is_custom_exchange_rate": false,
    "net_amount": "1200.00",
    "vat_rate": "23.00",
    "vat_amount": "276.00",
    "gross_amount": "1476.00",
    "net_amount_pln": null,
    "vat_amount_pln": null,
    "gross_amount_pln": null,
    "gross_amount_words": "jeden tysiąc czterysta siedemdziesiąt sześć złotych 00/100",
    "status": "unpaid",
    "is_paid": false,
    "is_imported": false,
    "is_edited": false,
    "edited_at": null,
    "pdf_url": "https://storage.url/invoices/uuid.pdf",
    "deleted_at": null,
    "created_at": "2025-01-15T12:00:00Z",
    "updated_at": "2025-01-15T12:00:00Z",
    "client": {
      "id": "uuid",
      "name": "Acme Corp",
      "tax_id": "1234567890",
      "street": "ul. Biznesowa 10",
      "city": "Warszawa",
      "postal_code": "00-001",
      "country": "Polska",
      "email": "contact@acme.com"
    },
    "items": [
      {
        "id": "uuid",
        "invoice_id": "uuid",
        "position": 1,
        "description": "Backend development",
        "quantity": "8.00",
        "unit_price": "150.00",
        "net_amount": "1200.00",
        "created_at": "2025-01-15T12:00:00Z",
        "updated_at": "2025-01-15T12:00:00Z",
        "time_entries": [
          {
            "time_entry": {
              "id": "uuid",
              "date": "2025-01-15",
              "hours": "8.00"
            }
          }
        ]
      }
    ]
  }
]
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Invoice belongs to different user
- `404 Not Found` - Invoice not found

---

### 7.3. Generate Invoice

**Endpoint:** `POST /api/invoices/generate`  
**Provider:** Custom Astro API  
**Description:** Generate new invoice from selected time entries

**Headers:**

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "client_id": "uuid",
  "issue_date": "2025-01-15",
  "sale_date": "2025-01-15",
  "vat_rate": 23.0,
  "time_entry_ids": ["uuid1", "uuid2", "uuid3"],
  "items": [
    {
      "description": "Backend development",
      "time_entry_ids": ["uuid1", "uuid2"]
    },
    {
      "description": "API integration",
      "time_entry_ids": ["uuid3"]
    }
  ],
  "custom_exchange_rate": null
}
```

**Success Response (201):**

```json
{
  "id": "uuid",
  "invoice_number": "INV/2025/001",
  "gross_amount": "1476.00",
  "currency": "PLN",
  "pdf_url": "https://storage.url/invoices/uuid.pdf",
  "message": "Invoice generated successfully"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid data or time entries already invoiced
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Time entries or client belong to different user
- `404 Not Found` - Client or time entries not found
- `500 Internal Server Error` - PDF generation failed

**Validation:**

- `client_id` is required
- `issue_date` and `sale_date` are required
- `vat_rate` must be one of: 0, 8, 23 (or any valid number for "ZW")
- `time_entry_ids` must contain at least 1 entry
- All time entries must belong to specified client
- All time entries must be unbilled (`invoice_id IS NULL`)
- All time entries must have same currency

**Business Logic:**

1. Validates all inputs
2. Groups time entries by description (from items array)
3. Calculates totals (net, VAT, gross)
4. If currency is EUR or USD:
   - Fetches exchange rate from NBP API or cache
   - Uses `custom_exchange_rate` if provided
   - Calculates PLN amounts
   - Caches exchange rate
5. Generates next invoice number (format: INV/YYYY/NNN)
6. Converts gross amount to words (Polish)
7. Creates invoice record
8. Creates invoice_items records with positions
9. Creates invoice_item_time_entries associations
10. Updates time_entries with invoice_id
11. Generates PDF using user's profile data (logo, accent color)
12. Uploads PDF to Supabase Storage
13. Returns invoice data with PDF URL

---

### 7.4. Update Invoice

**Endpoint:** `PUT /api/invoices/{invoice_id}`  
**Provider:** Custom Astro API  
**Description:** Update existing invoice (full edit capability)

**Headers:**

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "issue_date": "2025-01-16",
  "sale_date": "2025-01-16",
  "vat_rate": 23.0,
  "items": [
    {
      "position": 1,
      "description": "Backend development and bug fixes",
      "quantity": 10.0,
      "unit_price": 150.0
    }
  ],
  "custom_exchange_rate": null
}
```

**Success Response (200):**

```json
{
  "id": "uuid",
  "invoice_number": "INV/2025/001",
  "gross_amount": "1845.00",
  "currency": "PLN",
  "pdf_url": "https://storage.url/invoices/uuid.pdf",
  "is_edited": true,
  "edited_at": "2025-01-16T14:30:00Z",
  "message": "Invoice updated successfully"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid data
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Invoice belongs to different user
- `404 Not Found` - Invoice not found
- `500 Internal Server Error` - PDF regeneration failed

**Validation:**

- All fields can be edited
- If currency is foreign and exchange rate changes, recalculate PLN amounts

**Business Logic:**

1. Updates invoice fields
2. Deletes old invoice_items
3. Creates new invoice_items with updated data
4. Recalculates all amounts
5. Sets `is_edited = TRUE` and `edited_at = NOW()`
6. Regenerates PDF with updated data
7. Does NOT preserve original version (only current version stored)
8. Note: This does NOT modify time_entry associations (they remain unchanged)

---

### 7.5. Mark Invoice as Paid

**Endpoint:** `PATCH /rest/v1/invoices?id=eq.{invoice_id}`  
**Provider:** Supabase PostgREST  
**Description:** Toggle invoice paid status

**Headers:**

```
Authorization: Bearer {access_token}
apikey: {supabase_anon_key}
Content-Type: application/json
Prefer: return=representation
```

**Request Body:**

```json
{
  "is_paid": true,
  "status": "paid"
}
```

**Success Response (200):**

```json
[
  {
    "id": "uuid",
    "invoice_number": "INV/2025/001",
    "is_paid": true,
    "status": "paid",
    "updated_at": "2025-01-20T10:00:00Z"
  }
]
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Invoice belongs to different user
- `404 Not Found` - Invoice not found

---

### 7.6. Download Invoice PDF

**Endpoint:** `GET /api/invoices/{invoice_id}/pdf`  
**Provider:** Custom Astro API  
**Description:** Download invoice PDF file

**Headers:**

```
Authorization: Bearer {access_token}
```

**Success Response (200):**

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="faktura_INV-2025-001_Acme-Corp.pdf"

[PDF binary data]
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Invoice belongs to different user
- `404 Not Found` - Invoice or PDF not found
- `500 Internal Server Error` - PDF retrieval failed

**Business Logic:**

- Retrieves PDF from Supabase Storage
- Filename format: `faktura_{invoice_number}_{client_name}.pdf`
- Sanitizes client name for filename (removes special characters)

---

### 7.7. Delete Invoice (Soft Delete)

**Endpoint:** `PATCH /rest/v1/invoices?id=eq.{invoice_id}`  
**Provider:** Supabase PostgREST  
**Description:** Soft delete an invoice

**Headers:**

```
Authorization: Bearer {access_token}
apikey: {supabase_anon_key}
Content-Type: application/json
```

**Request Body:**

```json
{
  "deleted_at": "2025-01-20T15:00:00Z"
}
```

**Success Response (204):**
No content

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Invoice belongs to different user
- `404 Not Found` - Invoice not found

**Business Logic:**

- Sets `deleted_at` timestamp
- Sets `invoice_id` to NULL in associated time_entries (ON DELETE SET NULL)
- Deleted invoices are filtered out by RLS policies
- PDF remains in storage but is not accessible

---

### 7.8. Import Invoices from CSV

**Endpoint:** `POST /api/invoices/import`  
**Provider:** Custom Astro API  
**Description:** Import historical invoices from CSV file

**Headers:**

```
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

**Request Body:**

```
file: [CSV file]
```

**CSV Format:**

```csv
invoice_number,issue_date,sale_date,client_name,client_tax_id,client_street,client_city,client_postal_code,client_country,net_amount,vat_rate,vat_amount,gross_amount,currency
INV/2024/001,2024-12-15,2024-12-15,Acme Corp,1234567890,ul. Biznesowa 10,Warszawa,00-001,Polska,1200.00,23,276.00,1476.00,PLN
```

**Success Response (200):**

```json
{
  "success": true,
  "imported_count": 15,
  "created_clients": 2,
  "errors": [],
  "message": "Successfully imported 15 invoices"
}
```

**Success Response with Errors (207):**

```json
{
  "success": true,
  "imported_count": 12,
  "created_clients": 1,
  "errors": [
    {
      "row": 5,
      "error": "Invalid date format"
    },
    {
      "row": 8,
      "error": "Missing required field: client_name"
    }
  ],
  "message": "Imported 12 invoices with 2 errors"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid file format or missing file
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Import failed

**Validation:**

- File must be valid CSV
- Required fields: invoice_number, issue_date, sale_date, client_name, net_amount, vat_amount, gross_amount, currency
- Dates must be in YYYY-MM-DD format
- Currency must be PLN, EUR, or USD
- Amounts must be valid numbers

**Business Logic:**

1. Validates CSV format and structure
2. For each row:
   - Checks if client exists (by name), creates if not
   - Validates all fields
   - Creates invoice with `is_imported = TRUE`
   - Does NOT create time entries (only invoice records)
   - Does NOT generate PDF (imported invoices are data only)
3. Returns summary with count of imported invoices, created clients, and any errors

---

## 8. Exchange Rate Endpoints

### 8.1. Get Exchange Rate

**Endpoint:** `GET /api/exchange-rates/{currency}/{date}`  
**Provider:** Custom Astro API  
**Description:** Get exchange rate for currency and date (from cache or NBP API)

**Headers:**

```
Authorization: Bearer {access_token}
```

**URL Parameters:**

- `currency` - Currency code (EUR or USD)
- `date` - Date in YYYY-MM-DD format

**Success Response (200):**

```json
{
  "currency": "EUR",
  "date": "2025-01-15",
  "rate": "4.3215",
  "source": "cache"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid currency or date format
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Exchange rate not available for this date
- `502 Bad Gateway` - NBP API unavailable

**Business Logic:**

1. Checks cache for exchange rate on specified date
2. If not in cache:
   - Calls NBP API: `http://api.nbp.pl/api/exchangerates/rates/a/{currency}/{date}/`
   - Stores result in cache
3. If NBP API fails or date is weekend/holiday:
   - Tries previous business day (up to 7 days back)
4. Returns cached or fetched rate

---

### 8.2. Get Latest Exchange Rates

**Endpoint:** `GET /api/exchange-rates/latest`  
**Provider:** Custom Astro API  
**Description:** Get latest exchange rates for all supported currencies

**Headers:**

```
Authorization: Bearer {access_token}
```

**Success Response (200):**

```json
{
  "date": "2025-01-15",
  "rates": {
    "EUR": "4.3215",
    "USD": "3.9876"
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `502 Bad Gateway` - NBP API unavailable

**Business Logic:**

- Fetches latest rates for EUR and USD from NBP API
- Caches results
- Falls back to most recent cached rates if API fails

---

## 9. AI Insights Endpoints

### 9.1. Get AI Insights Status

**Endpoint:** `GET /api/ai-insights/status`  
**Provider:** Custom Astro API  
**Description:** Get current status of AI insights (threshold progress)

**Headers:**

```
Authorization: Bearer {access_token}
```

**Success Response (200):**

```json
{
  "unlocked": false,
  "entries_with_notes": 12,
  "threshold": 20,
  "progress_percentage": 60,
  "message": "Add 8 more entries with private notes to unlock AI Insights"
}
```

**Success Response (Unlocked):**

```json
{
  "unlocked": true,
  "entries_with_notes": 25,
  "threshold": 20,
  "progress_percentage": 100,
  "message": "AI Insights is ready for analysis"
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token

**Business Logic:**

- Counts time entries with non-empty `private_note`
- Threshold is 20 entries
- Returns progress and unlock status
- In MVP, detailed recommendations are NOT implemented (placeholder only)

---

### 9.2. Get AI Insights Data

**Endpoint:** `GET /rest/v1/ai_insights_data`  
**Provider:** Supabase PostgREST  
**Description:** Get aggregated data for AI analysis (for future use)

**Headers:**

```
Authorization: Bearer {access_token}
apikey: {supabase_anon_key}
```

**Query Parameters:**

- `order=date.desc` - Sort by date
- `limit=100` - Pagination limit

**Success Response (200):**

```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "time_entry_id": "uuid",
    "date": "2025-01-15",
    "day_of_week": 3,
    "hours": "8.00",
    "hourly_rate": "150.00",
    "private_note": "Lots of scope changes, client was unprepared",
    "created_at": "2025-01-15T18:00:00Z"
  }
]
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token

**Business Logic:**

- This data is automatically synced by database triggers
- Used for future AI analysis (post-MVP)
- In MVP, this is just data collection, no analysis performed

---

## 10. Dashboard Endpoints

### 10.1. Get Dashboard Summary

**Endpoint:** `GET /api/dashboard/summary`  
**Provider:** Custom Astro API  
**Description:** Get aggregated dashboard statistics

**Headers:**

```
Authorization: Bearer {access_token}
```

**Success Response (200):**

```json
{
  "clients_count": 5,
  "unbilled_hours": "45.50",
  "unpaid_invoices": {
    "PLN": "15230.00",
    "EUR": "2500.00",
    "USD": "1200.00"
  },
  "recent_time_entries": [
    {
      "id": "uuid",
      "date": "2025-01-15",
      "client_name": "Acme Corp",
      "hours": "8.00",
      "public_description": "Backend development"
    }
  ],
  "recent_invoices": [
    {
      "id": "uuid",
      "invoice_number": "INV/2025/001",
      "client_name": "Acme Corp",
      "gross_amount": "1476.00",
      "currency": "PLN",
      "is_paid": false
    }
  ],
  "ai_insights_progress": {
    "unlocked": false,
    "entries_with_notes": 12,
    "threshold": 20
  },
  "onboarding": {
    "completed": false,
    "current_step": 1
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Failed to fetch data

**Business Logic:**

- Aggregates data from multiple tables
- Returns 5 most recent time entries
- Returns 5 most recent invoices
- Groups unpaid invoice amounts by currency
- Includes AI insights status
- Includes onboarding progress

---

### 10.2. Get Notification about Unbilled Hours

**Endpoint:** `GET /api/notifications/unbilled-reminder`  
**Provider:** Custom Astro API  
**Description:** Check if user should receive reminder about unbilled hours

**Headers:**

```
Authorization: Bearer {access_token}
```

**Success Response (200):**

```json
{
  "show_notification": true,
  "unbilled_hours": "45.50",
  "message": "You have 45.50 unbilled hours this month. Time to generate invoices!"
}
```

**Success Response (No notification needed):**

```json
{
  "show_notification": false,
  "unbilled_hours": "0.00",
  "message": null
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token

**Business Logic:**

- Checks if today is the last day of the month
- Counts unbilled hours for current month
- Returns notification only if unbilled hours > 0 and it's last day of month
- Notification shown only once per day (tracked in session/localStorage)

---

## 11. Validation Rules Summary

### 11.1. Profile

- `tax_id`: 10 digits (if provided)
- `email`: valid email format
- `accent_color`: valid HEX format (#RRGGBB)
- `logo`: PNG/JPG, max 2MB

### 11.2. Client

- `name`: required, max 255 characters, unique per user
- `tax_id`: 10 digits (if provided)
- `email`: valid email format (if provided)
- `default_currency`: must be PLN, EUR, or USD
- `default_hourly_rate`: must be >= 0

### 11.3. Time Entry

- `client_id`: required, must exist and belong to user
- `hours`: required, must be > 0, max 999.99
- `hourly_rate`: required, must be >= 0
- `currency`: must be PLN, EUR, or USD
- `date`: required, valid date format
- Cannot edit if already invoiced (`invoice_id IS NOT NULL`)

### 11.4. Invoice

- `client_id`: required, must exist and belong to user
- `issue_date`: required, valid date
- `sale_date`: required, valid date
- `vat_rate`: must be >= 0 and <= 100
- `currency`: must be PLN, EUR, or USD
- `invoice_number`: required, unique per user
- If currency != PLN, `exchange_rate` is required
- All time entries must be unbilled and belong to same client

---

## 12. Authentication & Authorization

### 12.1. Authentication Method

**Supabase Auth with JWT Tokens**

All authenticated requests must include:

```
Authorization: Bearer {access_token}
```

For Supabase PostgREST endpoints, also include:

```
apikey: {supabase_anon_key}
```

### 12.2. Token Management

- **Access Token Lifetime**: 1 hour
- **Refresh Token Lifetime**: 30 days
- **Session Persistence**: 30 days (remember me) or until logout
- **Token Refresh**: Automatic using refresh token before expiration

### 12.3. Row-Level Security (RLS)

All database tables have RLS policies enforcing:

- Users can only access their own data
- `user_id` is automatically set from `auth.uid()` on INSERT
- Queries automatically filter by `auth.uid()`

### 12.4. Permission Model

**User Permissions:**

- Full CRUD on own profile
- Full CRUD on own clients
- Full CRUD on own time entries (except if already invoiced)
- Full CRUD on own invoices
- Read-only access to exchange rate cache

**System Permissions:**

- Service role can insert exchange rates
- Database triggers can manage AI insights data

---

## 13. Error Response Format

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context (optional)"
    }
  }
}
```

### 13.1. Common Error Codes

| Code                        | HTTP Status | Description                                            |
| --------------------------- | ----------- | ------------------------------------------------------ |
| `UNAUTHORIZED`              | 401         | Missing or invalid authentication token                |
| `FORBIDDEN`                 | 403         | User lacks permission for this resource                |
| `NOT_FOUND`                 | 404         | Resource not found                                     |
| `VALIDATION_ERROR`          | 400         | Request data failed validation                         |
| `CONFLICT`                  | 409         | Resource already exists or conflict with current state |
| `ALREADY_INVOICED`          | 400         | Cannot modify time entry that is already invoiced      |
| `EXCHANGE_RATE_UNAVAILABLE` | 502         | Cannot fetch exchange rate from NBP API                |
| `PDF_GENERATION_FAILED`     | 500         | Failed to generate invoice PDF                         |
| `UPLOAD_FAILED`             | 500         | Failed to upload file to storage                       |

---

## 14. Rate Limiting & Security

### 14.1. Rate Limiting

- **Authentication endpoints**: 10 requests per minute per IP
- **API endpoints**: 100 requests per minute per user
- **File uploads**: 10 uploads per hour per user
- **Export endpoints**: 20 exports per hour per user

### 14.2. Security Measures

- **HTTPS Only**: All API requests must use HTTPS
- **CORS**: Configured for specific frontend domains only
- **SQL Injection**: Protected by PostgREST and parameterized queries
- **XSS**: Input sanitization on all user-provided content
- **File Upload**: Validation of file types and sizes
- **Password Security**: Minimum 8 characters, letter and digit required
- **Session Security**: HTTPOnly cookies, secure flag, CSRF protection

### 14.3. Data Privacy

- **Private Notes**: Never included in exports or invoice PDFs
- **Soft Deletes**: Deleted records marked with `deleted_at`, not physically removed
- **Audit Trail**: `created_at` and `updated_at` on all records
- **Invoice Editing**: Tracked with `is_edited` and `edited_at` fields

---

## 15. Pagination & Filtering

### 15.1. Pagination

Supabase PostgREST supports pagination through query parameters:

```
GET /rest/v1/time_entries?limit=20&offset=40
```

**Default Limits:**

- Time Entries: 50 per page
- Invoices: 50 per page
- Clients: 100 per page (usually fewer)

**Response Headers:**

```
Content-Range: 40-59/150
```

### 15.2. Filtering

PostgREST supports rich filtering:

**Operators:**

- `eq` - equals
- `neq` - not equals
- `gt` - greater than
- `gte` - greater than or equal
- `lt` - less than
- `lte` - less than or equal
- `like` - pattern matching
- `ilike` - case-insensitive pattern matching
- `is` - is null/not null
- `in` - in list

**Examples:**

```
GET /rest/v1/time_entries?date=gte.2025-01-01&date=lte.2025-01-31
GET /rest/v1/clients?name=ilike.*acme*
GET /rest/v1/time_entries?invoice_id=is.null
```

### 15.3. Sorting

```
GET /rest/v1/invoices?order=issue_date.desc,invoice_number.asc
```

### 15.4. Selecting Related Data

```
GET /rest/v1/time_entries?select=*,client:clients(name,tax_id)
GET /rest/v1/invoices?select=*,client:clients(*),items:invoice_items(*)
```

---

## 16. API Versioning

- **Current Version**: v1
- **Supabase REST API**: `/rest/v1/*`
- **Supabase Auth API**: `/auth/v1/*`
- **Custom Astro API**: `/api/*` (unversioned in MVP)

**Future Versioning Strategy:**

- Custom API endpoints will be versioned as `/api/v2/*` when breaking changes occur
- Supabase endpoints follow Supabase versioning

---

## 17. Development & Testing

### 17.1. Base URLs

**Production:**

- Frontend: `https://coinect.app`
- API: `https://coinect.app/api`
- Supabase: `https://[project-ref].supabase.co`

**Development:**

- Frontend: `http://localhost:4321`
- API: `http://localhost:4321/api`
- Supabase: `http://localhost:54321`

### 17.2. Environment Variables

Required environment variables:

```
PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NBP_API_URL=http://api.nbp.pl/api
```

### 17.3. Testing Strategy

- **Unit Tests**: Business logic in custom API endpoints
- **Integration Tests**: Full flow from API call to database
- **E2E Tests**: Critical user journeys (registration, invoice generation)
- **RLS Tests**: Verify users cannot access other users' data

---

## 18. Performance Considerations

### 18.1. Database Optimization

- Strategic indexes on frequently queried columns
- Conditional indexes for soft-deleted records
- GIN index for JSONB tags in AI insights

### 18.2. Caching

- Exchange rates cached in database
- Consider Redis for session caching (post-MVP)
- Static assets cached with CDN

### 18.3. Query Optimization

- Use PostgREST's `select` parameter to fetch only needed fields
- Limit number of related records fetched
- Use pagination for large result sets

### 18.4. File Storage

- Invoice PDFs stored in Supabase Storage
- User logos stored in Supabase Storage
- Consider separate CDN for static assets (post-MVP)

---

## 19. Monitoring & Logging

### 19.1. Logging

Log the following events:

- Authentication attempts (success/failure)
- Invoice generation
- Invoice editing
- Failed API calls
- Exchange rate fetch failures

### 19.2. Metrics

Track these metrics:

- API response times
- Invoice generation time
- PDF generation failures
- NBP API availability
- Authentication success rate

### 19.3. Error Tracking

- Use error tracking service (e.g., Sentry)
- Capture full error context (user_id, endpoint, request body)
- Alert on critical errors (PDF generation, payment status changes)

---

## 20. Future API Enhancements (Post-MVP)

### 20.1. Planned Features

- **Webhooks**: Notify external systems of invoice events
- **Bulk Operations**: Batch create/update time entries
- **Advanced Filtering**: Saved filter presets
- **Recurring Invoices**: Automated invoice generation
- **KSeF Integration**: Polish e-invoice system
- **AI Recommendations**: Endpoint for rate optimization suggestions
- **Team Features**: Multi-user support with roles
- **API Keys**: For third-party integrations

### 20.2. GraphQL Consideration

Consider migrating to GraphQL for:

- More flexible queries
- Reduced over-fetching
- Better type safety
- Real-time subscriptions

---

## Appendix A: Sample API Flows

### A.1. User Registration Flow

1. `POST /auth/v1/signup` - Create account
2. Auto-trigger creates profile
3. Redirect to onboarding

### A.2. Generate First Invoice Flow

1. `GET /rest/v1/clients` - List clients
2. `GET /rest/v1/time_entries?client_id=eq.{id}&invoice_id=is.null` - Get unbilled entries
3. `GET /api/exchange-rates/EUR/2025-01-15` - Get exchange rate (if needed)
4. `POST /api/invoices/generate` - Generate invoice
5. `GET /api/invoices/{id}/pdf` - Download PDF

### A.3. Daily Dashboard Load Flow

1. `GET /api/dashboard/summary` - Get all dashboard data
2. `GET /api/notifications/unbilled-reminder` - Check for notifications
3. Display aggregated information

---

## Appendix B: Database Triggers Integration

API endpoints leverage these database triggers:

1. **create_profile_for_user()**: Automatically creates profile on user registration
2. **update_updated_at_column()**: Auto-updates `updated_at` on record changes
3. **sync_ai_insights_data()**: Syncs time entries to AI insights table
4. **sync_ai_insights_tags()**: Updates tags in AI insights when tags change

These triggers ensure data consistency without requiring explicit API calls.
