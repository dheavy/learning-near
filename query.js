require('dotenv').config();

const near = require('near-api-js');
const options = require('./options')();

async function main() {
  const client = await near.connect(options);
  const provider = client.connection.provider;

  // Fetch node status.
  const status = await provider.status();
  console.log('network status:', status);

  // Get latest block.
  let block = await provider.block({ finality: 'final' });
  console.log('current block:', block);

  // Get block by number.
  block = await provider.block({ blockId: status.sync_info.latest_block_height });
  console.log('block by height:', block);

  // Fetch validators.
  // const validators = await provider.validators(block.header.height);
  // console.log('network validators:', validators);

  // Fetch my own account.
  const account = await client.account(options.accountId);
  console.log('account state:', await account.state());

  // Fetch gas price.
  const gasPrice = await provider.sendJsonRpc('gas_price', [null]);
  console.log('gas price:', gasPrice);

  // Get current gas price from thee block header.
  const anotherBlock = await provider.sendJsonRpc('block', { finality: 'final' });
  console.log('gas price from header:', anotherBlock.header.gas_price);
}

main();
