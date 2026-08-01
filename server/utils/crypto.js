const crypto = require('crypto');

// Ensure key is 32 bytes (256 bits)
const rawKey = process.env.AES_SECRET_KEY || 'codtech_default_32byte_secret_key!';
const KEY = crypto.createHash('sha256').update(rawKey).digest();

const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypt a text string using AES-256-GCM
 * @param {string} text 
 * @returns {string} iv:authTag:encryptedHex
 */
function encrypt(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt a cipher string using AES-256-GCM
 * @param {string} cipherText (iv:authTag:encryptedHex)
 * @returns {string} decrypted text
 */
function decrypt(cipherText) {
  if (!cipherText) return '';
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 3) return cipherText; // Fallback if not encrypted in expected format
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption error:', err.message);
    return '[Decryption Error]';
  }
}

module.exports = { encrypt, decrypt };
