-- Client IDs are exactly four digits, such as 0042 (ADR-054). Replaces the 2.3 rule (capitals, digits
-- and hyphens, up to 20 characters). Stored as text, so a leading zero is kept. Only the rule changes here:
-- if any client's ID doesn't fit, adding the rule fails and nothing in this file is applied.

alter table public.clients drop constraint clients_code_format_check;

alter table public.clients
  add constraint clients_code_format_check check (code ~ '^[0-9]{4}$');
