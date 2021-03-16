require('dotenv').config();

const near = require('near-api-js');
const credentialsPath = './credentials';

// Formatter helper for Near amounts.
function formatAmount(amount) {
  return BigInt(near.utils.format.parseNearAmount(amount.toString()));
}

// Configure keyStore to be used with the SDK.
const UnencryptedFileSystemKeyStore = near.keyStores.UnencryptedFileSystemKeyStore;
const keyStore = new UnencryptedFileSystemKeyStore(credentialsPath);

const options = require('./options')(keyStore);

// Configure transaction details.
const txSender = options.accountId;
const txReceiver = 'pizza.testnet';
const txAmount = formatAmount(1);

async function main() {
  const client = await near.connect(options);
  const account = await client.account(txSender, txAmount);
  const provider = client.connection.provider;

  console.log(`Sending money to ${txReceiver}`);

  try {
    const result = await account.sendMoney(txReceiver, txAmount);

    console.log('Creation result:', result.transaction);
    console.log('----------------------------------------------------------');
    console.log('Open link below to see transaction in NEAR explorer');
    console.log(`${options.explorerUrl}/transactions/${result.transaction.hash}`);
    console.log('----------------------------------------------------------');

    setTimeout(async function() {
      console.log('Checking transaction status:', result.transaction.hash);
      const status = await provider.sendJsonRpc('tx', [result.transaction.hash, options.accountId]);
      console.log('Transaction status:', status);
    }, 5000);
  }
  catch(error) {
    console.error(error);
  }
}

main();
