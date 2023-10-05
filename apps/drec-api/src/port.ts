export function extractPort(url: string): number | null {
  if (url) {
    const backendUrlSplit: string[] = url.split(':');
    const extractedPort: number = parseInt(
      backendUrlSplit[backendUrlSplit.length - 1],
      10,
    );

    return extractedPort;
  }

  return null;
}

export function getPort(): number {
  return parseInt(process.env.PORT || process.env.BACKEND_PORT || '3040', 10);
}
