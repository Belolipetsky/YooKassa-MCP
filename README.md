# YooKassa MCP Server

MCP (Model Context Protocol) server for the [YooKassa](https://yookassa.ru) payment API. Enables AI assistants to manage payments, refunds, receipts, webhooks, and saved payment methods through natural language.

## Tools

### Payments
| Tool | Description |
|------|-------------|
| `yookassa_create_payment` | Create a payment and get confirmation URL |
| `yookassa_get_payment` | Get payment details by ID |
| `yookassa_list_payments` | List payments with filters (status, date range, method) |
| `yookassa_capture_payment` | Capture held payment (two-stage) |
| `yookassa_cancel_payment` | Cancel a held payment |

### Refunds
| Tool | Description |
|------|-------------|
| `yookassa_create_refund` | Create full or partial refund |
| `yookassa_get_refund` | Get refund details by ID |
| `yookassa_list_refunds` | List refunds with filters |

### Webhooks
| Tool | Description |
|------|-------------|
| `yookassa_create_webhook` | Subscribe to payment events |
| `yookassa_list_webhooks` | List all webhook subscriptions |
| `yookassa_delete_webhook` | Remove a webhook subscription |

### Receipts (54-ФЗ)
| Tool | Description |
|------|-------------|
| `yookassa_get_receipt` | Get fiscal receipt by ID |
| `yookassa_list_receipts` | List fiscal receipts |

### Payment Methods
| Tool | Description |
|------|-------------|
| `yookassa_get_payment_method` | Get saved payment method |
| `yookassa_list_payment_methods` | List saved payment methods |

## Setup

### 1. Get credentials

In your [YooKassa Merchant Profile](https://yookassa.ru/my/api-keys-settings), get your **Shop ID** and **Secret Key**.

### 2. Install & build

```bash
npm install
npm run build
```

### 3. Configure Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "yookassa": {
      "command": "node",
      "args": ["/absolute/path/to/yookassa-mcp-server/dist/index.js"],
      "env": {
        "YOOKASSA_SHOP_ID": "your_shop_id",
        "YOOKASSA_SECRET_KEY": "your_secret_key"
      }
    }
  }
}
```

### 4. HTTP mode (optional)

```bash
TRANSPORT=http PORT=3000 YOOKASSA_SHOP_ID=xxx YOOKASSA_SECRET_KEY=yyy node dist/index.js
```

## Example prompts

- "Create a payment for 1500 RUB for order #42"
- "Show me all failed payments from last week"
- "Refund 500 RUB from payment 22d6d597-000f-5000-9000-145f6df21d6f"
- "Set up a webhook for payment.succeeded events at https://mysite.com/hooks"
- "List all my webhooks"
- "Show fiscal receipts for payment pay_xxx"

## Authentication

Uses **HTTP Basic Auth** (Shop ID + Secret Key). Credentials are passed via environment variables and never logged.

## Response formats

All tools support `response_format: "markdown"` (default, human-readable) or `"json"` (machine-readable structured data).
