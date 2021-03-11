require('dotenv').config();

const near = require('near-api-js');
const fs = require('fs');

const credentialsPath = './credentials';

// Configure keystore to bee used with NEAR JS API.
const UnencryptedFileSystemKeyStore = near.keyStores.UnencryptedFileSystemKeyStore;
const keyStore = new UnencryptedFileSystemKeyStore(credentialsPath);

const options = {
  networkId:    process.env.NEAR_NETWORK,
  nodeUrl:      process.env.NEAR_NODE_URL,
  walletUrl:    `https://wallet.${process.env.NEAR_NETWORK}.near.org`,
  helperUrl:    `https://helper.${process.env.NEAR_NETWORK}.near.org`,
  explorerUrl:  `https://explorer.${process.env.NEAR_NETWORK}.near.org`,
  accountId:    process.env.NEAR_ACCOUNT,
  keyStore
};

async function main() {
  let keyPair;

  const client = await near.connect(options);

  // Configure key pair file location
  const keyRootPath = client.connection.signer.keyStore.keyDir;
  const keyFilePath = `${keyRootPath}/${options.networkId}/${options.accountId}.json`

  // Check if key pair exists, create a new one otherwise.
  if (!fs.existsSync(keyFilePath)) {
    console.log('Generating a new key pair');
    keyPair = near.KeyPair.fromRandom('ed25519');
  } else {
    let content = JSON.parse(fs.readFileSync(keyFilePath).toString());
    keyPair = near.KeyPair.fromString(content.private_key);
    console.log(`Key pair for account ${options.accountId} already exists, skipping...`);
  }

  // Create new key pair in credentials dir.
  await client.connection.signer.keyStore.setKey(options.networkId, options.accountId, keyPair);
  try {
    await client.account(options.accountId);
    return console.log(`Sorry, account "${options.accountId}" already exists.`);
  } catch (e) {
    if (!e.message.includes('does not exist while viewing')) {
      throw e;
    }
  }

  // Generate a public key for account creation step.
  const publicKey = keyPair.getPublicKey();

  // Create account.
  try {
    const res = await client.createAccount(options.accountId, publicKey);
    console.log(`Account ${res.accountId} for network "${options.networkId}" was created.`);
    console.log('----------------------------------------------------------------');
    console.log('Open link below to see account in NEAR explorer');
    console.log(`${options.explorerUrl}/accounts/${res.accountId}`);
    console.log('----------------------------------------------------------------');
  } catch (e) {
    console.log('ERROR: ', e);
  }
}

main();
