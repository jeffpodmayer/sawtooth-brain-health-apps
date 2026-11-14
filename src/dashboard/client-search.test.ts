import { expect, it } from "vitest";
import { matchingClients, type ClientSummary } from "./client-search";

function client(code: string, lastVisitAt: string | null): ClientSummary {
  return { id: code, code, lastVisitAt, visitOpen: false };
}

const clients = [
  client("1234", "2026-11-10T10:00:00Z"),
  client("1203", "2026-11-14T10:00:00Z"),
  client("0120", "2026-11-13T10:00:00Z"),
  client("1299", null),
];

it("shows nothing until something is typed", () => {
  expect(matchingClients(clients, "")).toEqual([]);
});

it("matches IDs that start with what's typed, newest visit first, no visits last", () => {
  expect(matchingClients(clients, "12").map((c) => c.code)).toEqual(["1203", "1234", "1299"]);
});

it("finds the one client when all four digits are typed", () => {
  expect(matchingClients(clients, "1234").map((c) => c.code)).toEqual(["1234"]);
});

it("shows at most eight", () => {
  const many = Array.from({ length: 12 }, (_, i) => client(`10${String(i).padStart(2, "0")}`, null));
  expect(matchingClients(many, "1")).toHaveLength(8);
});
