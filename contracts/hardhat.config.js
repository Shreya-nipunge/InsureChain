require("@nomicfoundation/hardhat-toolbox");
const { subtask } = require("hardhat/config");
const { TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD } = require("hardhat/builtin-tasks/task-names");

// Use the solc version already pinned in package-lock.json; no compiler download is needed.
subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD).setAction(async ({ solcVersion }, _hre, runSuper) => {
  if (solcVersion !== "0.8.26") {
    return runSuper();
  }

  const solc = require("solc");
  return {
    compilerPath: require.resolve("solc/soljson.js"),
    isSolcJs: true,
    version: solcVersion,
    longVersion: solc.version(),
  };
});

module.exports = {
  solidity: "0.8.26",
  networks: {
    // Run `npx hardhat node` in one terminal, then use --network localhost.
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
};
