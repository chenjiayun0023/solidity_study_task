require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  namedAccounts: {
    deployer: 0,
    user: 1,
    user2: 2,
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,  //infura里面拿
      accounts: [process.env.SEPOLIA_PRIVATE_KEY]   //钱包私钥
    }
  }

};
