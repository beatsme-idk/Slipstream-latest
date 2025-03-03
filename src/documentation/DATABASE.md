# Database Documentation

## Tables

### invoices

Stores all invoice data and manages unique short IDs for sharing.

#### Columns
- `id` (uuid): Primary key
- `data` (jsonb): Full invoice data
- `created_at` (timestamptz): Creation timestamp
- `updated_at` (timestamptz): Last update timestamp
- `short_id` (text): Unique random identifier for sharing
- `is_paid` (boolean): Payment status
- `tx_hash` (text): Transaction hash when paid
- `paid_at` (timestamptz): Payment timestamp
- `creator_id` (uuid): Reference to auth.users

#### Features
- Automatic short_id generation
- Automatic timestamps
- Row-level security policies
- JSON storage for flexible invoice data

## Functions

### generate_short_id()
Generates a random 8-character string for invoice URLs.

### set_short_id()
Trigger function to ensure unique short_ids.

## Security

### Row Level Security Policies
1. "Anyone can create invoices"
   - Allows public invoice creation
2. "Anyone can read invoices by short_id"
   - Public read access using short_id
3. "Creators can update their invoices"
   - Only creators can modify their invoices

## Usage

### Creating an Invoice
```typescript
const { short_id } = await createInvoice(invoiceData);
```

### Retrieving an Invoice
```typescript
const invoice = await getInvoice(shortId);
```

### Updating an Invoice
```typescript
const updated = await updateInvoice(shortId, newData);
```

### Marking as Paid
```typescript
const paid = await markInvoiceAsPaid(shortId, txHash);
```