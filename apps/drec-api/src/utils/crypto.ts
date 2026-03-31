import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM

const checkEncryptionSecret = () => {
  if (!process.env.ENCRYPTION_SECRET) {
    throw new Error('ENCRYPTION_SECRET environment variable is not set');
  }
};

export const encrypt = (text: string): string => {
  checkEncryptionSecret();

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(process.env.ENCRYPTION_SECRET!, 'hex'),
    iv,
  );
  const encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return iv.toString('hex') + ':' + encrypted + ':' + authTag;
};

export const decrypt = (encryptedText: string): string => {
  checkEncryptionSecret();

  const parts = encryptedText.split(':');

  // Support legacy CBC format (iv:ciphertext) for existing data
  if (parts.length === 2) {
    const [ivHex, encryptedHex] = parts;
    if (!ivHex || !encryptedHex) {
      throw new Error('Invalid encrypted data format');
    }
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      process.env.ENCRYPTION_SECRET!,
      iv,
    );
    return (
      decipher.update(encryptedHex, 'hex', 'utf8') + decipher.final('utf8')
    );
  }

  // GCM format (iv:ciphertext:authTag)
  const [ivHex, encryptedHex, authTagHex] = parts;
  if (!ivHex || !encryptedHex || !authTagHex) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(process.env.ENCRYPTION_SECRET!, 'hex'),
    iv,
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  return decipher.update(encryptedHex, 'hex', 'utf8') + decipher.final('utf8');
};
