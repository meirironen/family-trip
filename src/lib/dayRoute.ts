/** Split at shared stops so mobile Maps links retain the whole itinerary. */
export function dayRouteLinks(stops: string[], start: string | null): string[] {
  if (!stops.length) return [];
  const remaining = [...stops];
  let origin = start;
  const links: string[] = [];
  while (remaining.length) {
    const leg = remaining.splice(0, 4);
    const params = new URLSearchParams({ api: '1', travelmode: 'driving', destination: leg[leg.length - 1] });
    if (origin) params.set('origin', origin);
    if (leg.length > 1) params.set('waypoints', leg.slice(0, -1).join('|'));
    links.push(`https://www.google.com/maps/dir/?${params}`);
    origin = leg[leg.length - 1];
  }
  return links;
}
