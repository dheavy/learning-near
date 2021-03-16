const options = (keyStore = {}) => {
  return {
    networkId:   process.env.NEAR_NETWORK,
    nodeUrl:     process.env.NEAR_NODE_URL,
    walletUrl:   `https://wallet.${process.env.NEAR_NETWORK}.near.org`,
    helperUrl:   `https://helper.${process.env.NEAR_NETWORK}.near.org`,
    explorerUrl: `https://explorer.${process.env.NEAR_NETWORK}.near.org`,
    accountId:   process.env.NEAR_ACCOUNT,
    keyStore
  };
}

module.exports = options;
