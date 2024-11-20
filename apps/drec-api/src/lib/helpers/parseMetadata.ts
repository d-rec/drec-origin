export const parseMetadata = (metadata: any) => {
  try {
    if (typeof metadata !== 'string') return metadata;
    return JSON.parse(metadata);
  } catch (e) {
    console.error(e, `certificate doesnt contains valid metadata ${metadata}`);
    return null;
  }
};
