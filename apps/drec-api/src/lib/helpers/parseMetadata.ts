export const parseMetadata = (
  metadata: Record<string, unknown>,
): Record<string, unknown> | null => {
  try {
    if (typeof metadata !== 'string') return metadata;
    return JSON.parse(metadata);
  } catch (e) {
    console.error(
      e,
      `certificate doesnt contains valid metadata ${JSON.stringify(metadata)}`,
    );
    return null;
  }
};
