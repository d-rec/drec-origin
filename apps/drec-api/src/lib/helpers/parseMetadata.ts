export const parseMetadata = (metadata: Record<string, unknown>): any | null => {
  try {
    if (typeof metadata !== 'string') return metadata;
    return JSON.parse(metadata);
  } catch (e) {
    console.error(e, `certificate doesnt contains valid metadata ${metadata}`);
    return null;
  }
};
