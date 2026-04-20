import { createEscrow, releaseEscrow } from './src/services/escrow.js';
import { generateKeypair, fundWithFriendbot } from './src/services/stellar.js';
import { run, insert } from './src/db/database.js';
import { v4 as uuidv4 } from 'uuid';

async function runTest() {
  const contractId = uuidv4();
  const creator = generateKeypair().publicKey;
  const signer = generateKeypair().publicKey;
  const dest = generateKeypair().publicKey;

  console.log('Funding destination account...');
  await fundWithFriendbot(dest);
  
  console.log('Inserting contract test in db...');
  run('PRAGMA foreign_keys = OFF;');
  insert('contracts', {
    id: contractId,
    creator_public_key: creator,
    title: 'test',
    description: '',
    amount: '10',
    asset_code: 'XLM',
    asset_issuer: null,
    destination: dest,
    dest_asset_code: null,
    dest_asset_issuer: null,
    status: 'funded'
  });

  console.log('Creating escrow...');
  const res = await createEscrow(contractId, [signer], creator, 2);
  console.log('Created escrow:', res);

  console.log('Trying to release escrow...');
  try {
    const result = await releaseEscrow(contractId);
    console.log('Release result:', result.hash);
  } catch (err) {
    console.error('Release failed:', err.message);
  }
}

runTest().then(() => console.log('Done')).catch(console.error);
