import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import '@openzeppelin/hardhat-upgrades';
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.11",

  networks: {
    localhost: {
      url: "http://127.0.0.1:8545", // same address and port for both Buidler and Ganache node
    }
  }
};


export default config;
