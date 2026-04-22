import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const config = {
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
  },
  horizon: {
    url: process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org',
    networkPassphrase: process.env.NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-dev-secret',
    expiresIn: '24h',
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  },
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
  },
  monitor: {
    intervalMs: parseInt(process.env.MONITOR_INTERVAL_MS || '30000', 10),
  },
  admin: {
    wallet: process.env.ADMIN_WALLET || '', // The public key of the admin user
  },
};

export default config;
