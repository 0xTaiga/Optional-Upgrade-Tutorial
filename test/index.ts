import { TransactionResponse } from "@ethersproject/abstract-provider";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, ContractFactory, Signer, Transaction } from "ethers";
import { ethers, upgrades } from "hardhat";


let deployer: SignerWithAddress
let lender: SignerWithAddress
let factory: Contract
let pool: Contract
let poolV2: Contract
let poolImpl: Contract
let poolImplV2: Contract
let LendingPool: ContractFactory
let LendingPoolV2: ContractFactory
let PoolFactory: ContractFactory

const RANDOM_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F'

async function getPoolAddress(tx: TransactionResponse, PoolFactory: ContractFactory): Promise<string> {
  let receipt = await tx.wait();
  let log = PoolFactory.interface.parseLog(receipt.logs[3])
  const poolAddress: string = log.args["_poolAddress"]
  return poolAddress
}

describe("Test: Upgrade pool implementation", function () {
  before(async () => {
    // Participants
    [deployer, lender] = await ethers.getSigners()

    // Lending Pool V1
    LendingPool = await ethers.getContractFactory("PoolImplementation")
    poolImpl = await LendingPool.deploy()
    await poolImpl.deployed()

    // Lending Pool V2
    LendingPoolV2 = await ethers.getContractFactory("PoolImplementationV2")
    poolImplV2 = await LendingPoolV2.deploy()
    await poolImplV2.deployed()

    // Pool Factory
    PoolFactory = await ethers.getContractFactory("PoolFactory")
    factory = await PoolFactory.deploy(poolImpl.address)
    await factory.deployed()
  });

  it("Should deploy the pool correclty", async function () {
    let tx: TransactionResponse = await factory.connect(lender).deployPool()
    pool = LendingPool.attach(await getPoolAddress(tx, PoolFactory))
    expect(await pool.version()).to.equal(1)
    expect(await pool.owner()).to.equal(lender.address)
    expect(await factory.poolImplementationAddress()).to.equal(poolImpl.address)
    expect(await factory.rollBackImplementation()).to.equal(poolImpl.address)
  });

  it("Should fail to try upgrade by not lender", async function () {
    await expect(pool.connect(deployer).upgradeTo(poolImplV2.address)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });

  it("Should fail to try upgrade to illegal implemetation", async function () {
    await expect(pool.connect(lender).upgradeTo(poolImplV2.address)).to.be.revertedWith(
      "IllegalImplementation()"
    );
  });

  it("Should update the implementation on the factory", async function () {
    await factory.setImplementation(poolImplV2.address)
    expect(await factory.poolImplementationAddress()).to.equal(poolImplV2.address)
    expect(await factory.rollBackImplementation()).to.equal(poolImpl.address)
  });

  it("Should fail to try upgrade when upgrades are not allowed", async function () {
    await expect(pool.connect(lender).upgradeTo(poolImplV2.address)).to.be.revertedWith(
      "UpgradeNotAllowed()"
    );
  });
 
  it("Should allow upgrades", async function () {
    expect(await factory.allowUpgrade()).to.equal(false)
    await factory.flipAllowUpgrade();
    expect(await factory.allowUpgrade()).to.equal(true)
  });

  it("Should fail to try upgrade to illegal implemetation", async function () {
    await expect(pool.connect(lender).upgradeTo(RANDOM_ADDRESS)).to.be.revertedWith(
      "IllegalImplementation()"
    );
  });

  it("Should upgrade existing pool to V2", async function () {
    await pool.connect(lender).upgradeTo(poolImplV2.address)
    expect(await pool.version()).to.equal(2)
  });

  it("Should disable upgrades", async function () {
    expect(await factory.allowUpgrade()).to.equal(true)
    await factory.flipAllowUpgrade();
    expect(await factory.allowUpgrade()).to.equal(false)
  });

  it("Should deploy new pool correclty", async function () {
    let tx: TransactionResponse = await factory.connect(lender).deployPool()
    poolV2 = LendingPool.attach(await getPoolAddress(tx, PoolFactory))
    expect(await poolV2.version()).to.equal(2)
    expect(await poolV2.owner()).to.equal(lender.address)
  });

  it("Should fail to downgrade existing pool to V1", async function () {
    await expect(poolV2.connect(lender).upgradeTo(poolImpl.address)).to.be.revertedWith(
      "UpgradeNotAllowed()"
    );
  });

  it("Should enable upgrades", async function () {
    expect(await factory.allowUpgrade()).to.equal(false)
    await factory.flipAllowUpgrade();
    expect(await factory.allowUpgrade()).to.equal(true)
  });

  it("Should downgrade existing pool to V1", async function () {
    await poolV2.connect(lender).upgradeTo(poolImpl.address)
    expect(await poolV2.version()).to.equal(1)
  });

  it("Should disable upgrades", async function () {
    expect(await factory.allowUpgrade()).to.equal(true)
    await factory.flipAllowUpgrade();
    expect(await factory.allowUpgrade()).to.equal(false)
  });

});
