/**
 * Estimate the number of SMS segments for a message body.
 * GSM-7 encoding: 160 chars per segment.
 * UCS-2 encoding: 70 chars per segment.
 * Multi-part: 153 / 67 chars per segment respectively.
 */
export function estimateSegments(body: string): number {
  if (!body) return 0;

  // Check if body contains non-GSM characters
  // eslint-disable-next-line no-control-regex
  const isGsm = /^[\x00-\x7F¡£¤¥§¿ÄÅÆÇÉÑÖØÜßàäåæèéìñòöøùü\n\r]+$/.test(body);

  if (isGsm) {
    return body.length <= 160 ? 1 : Math.ceil(body.length / 153);
  }

  return body.length <= 70 ? 1 : Math.ceil(body.length / 67);
}
