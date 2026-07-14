# Error Contracts

No runtime API error contract is implemented yet.

Future APIs should use consistent error responses with:

- Stable error code.
- Human-safe message.
- Request correlation id, when available.
- Validation details for user-fixable input.
- No secrets or private internals.
