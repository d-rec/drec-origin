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
  return (
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    parseInt(process.env.PORT!, 10) ||
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    parseInt(process.env.BACKEND_PORT!, 10) ||
    3030
  );
}
