import * as crypto from 'crypto';

const HASH_ALGORITHM = 'aes-256-cbc';

const checkEncryptionSecret = () => {
  if (!process.env.ENCRYPTION_SECRET) {
    throw new Error('ENCRYPTION_SECRET environment variable is not set');
  }
};

export const encrypt = (text: string): string => {
  checkEncryptionSecret();

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    HASH_ALGORITHM,
    process.env.ENCRYPTION_SECRET,
    iv,
  );
  const encrypted = cipher.update(text, 'utf8', 'hex');
  return iv.toString('hex') + ':' + encrypted + cipher.final('hex');
};

export const decrypt = (encryptedText: string): string => {
  checkEncryptionSecret();

  const [ivHex, encryptedHex] = encryptedText.split(':');
  if (!ivHex || !encryptedHex) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(
    HASH_ALGORITHM,
    process.env.ENCRYPTION_SECRET,
    iv,
  );
  const decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  return decrypted + decipher.final('utf8');
};
