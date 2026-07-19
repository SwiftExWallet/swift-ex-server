export function getClientIpFromRequest(req: any): string {
  return (
    req.ip ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    'Unknown'
  );
}
