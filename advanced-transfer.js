require('dotenv').config();

const near = require('near-api-js');
const { sha256 } = require('js-sha256');
const fs = require('fs');

function formatAmount(amount) {
  return BigInt(near.utils.format.parseNearAmount(amount.toString()));
}

const credentialsPath = './credentials';
const UnencryptedFileSystemKeyStore = near.keyStores.UnencryptedFileSystemKeyStore;
const keyStore = new UnencryptedFileSystemKeyStore(credentialsPath);
const options = require('./options')(keyStore);

const txSender = options.accountId;
const txReceiver = 'pizza.testnet';
const txAmount = formatAmount(1);

async function main() {
  const client = await near.connect(options);
  const provider = client.connection.provider;

  const keyRootPath = client.connection.signer.keyStore.keyDir;
  const keyFilePath = `${keyRootPath}/${options.networkId}/${options.accountId}.json`;

  const content = JSON.parse(fs.readFileSync(keyFilePath).toString());
  const keyPair = near.KeyPair.fromString(content.private_key);

  const publicKey = keyPair.getPublicKey();
  console.log('Sender public key:', publicKey);

  const accessKey = await provider.query(
    `access_key/${txSender}/${publicKey.toString()}`, ''
  );
  console.log('Sender public key:', accessKey);

  if (accessKey.permission !== 'FullAccess') {
    return console.log(`Account [${txSender}] does not have permission to send tokens using key: [${publicKey}]`);
  }

  const nonce = ++accessKey.nonce;
  console.log('Calculated nonce:', nonce);

  const actions = [near.transactions.transfer(txAmount)];
  const recentBlockHash = near.utils.serialize.base_decode(accessKey.block_hash);
  const transaction = near.transactions.createTransaction(
    txSender,
    publicKey,
    txReceiver,
    nonce,
    actions,
    recentBlockHash
  );

  // Before we can sign the transaction we must perform three steps
  // 1) Serialize the transaction in Borsh
  const serializedTx = near.utils.serialize.serialize(
    near.transactions.SCHEMA,
    transaction
  );

  // 2) Hash the serialized transaction using sha256
  const serializedTxHash = new Uint8Array(sha256.array(serializedTx));

  // 3) Create a signature using the hashed transaction
  const signature = keyPair.sign(serializedTxHash);

  // Sign the transaction
  const signedTransaction = new near.transactions.SignedTransaction({
    transaction,
    signature: new near.transactions.Signature({
      keyType: transaction.publicKey.keyType,
      data: signature.signature
    })
  });

  try {
    const result = await provider.sendTransaction(signedTransaction);

    console.log('Creation result:', result.transaction);
    console.log('----------------------------------------------------------------');
    console.log('OPEN LINK BELOW to see transaction in NEAR Explorer!');
    console.log(`${options.explorerUrl}/transactions/${result.transaction.hash}`);
    console.log('----------------------------------------------------------------');

    setTimeout(async function() {
      console.log('Checking transaction status:', result.transaction.hash);

      const status = await provider.sendJsonRpc('tx', [result.transaction.hash, options.accountId]);
      console.log('Transaction status:', status);
    }, 5000);
  }
  catch(error) {
    console.error('ERROR:', error);
  }
}

main();
