/**
 * Converts a Wayback Machine timestamp to ISO8601 format
 * @param timestamp Wayback timestamp (YYYYMMDDhhmmss)
 * @returns ISO8601 formatted timestamp
 */
export function waybackTimestampToISO(timestamp: string): string {
  return timestamp.length >= 14 
    ? `${timestamp.slice(0,4)}-${timestamp.slice(4,6)}-${timestamp.slice(6,8)}T${timestamp.slice(8,10)}:${timestamp.slice(10,12)}:${timestamp.slice(12,14)}Z`
    : new Date().toISOString() // fallback to current date if format not recognized
}