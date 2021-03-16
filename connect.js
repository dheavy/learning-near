require('dotenv').config();

const near = require('near-api-js');
const options = require('./options');

async function main() {
  const client = await near.connect(options);
  const provider = client.connection.provider;
  console.log('Client config: ', client.config);

  const status = await provider.status();
  console.log('Status: ', status);
}

main();
