// A client's test link. It uses the address this dashboard is on, so development makes development links
// and production makes production ones.
export function clientLink(linkToken: string): string {
  return `${window.location.origin}/t/${linkToken}`;
}
