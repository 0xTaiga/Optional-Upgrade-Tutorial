//SPDX-License-Identifier: Unlicense
/**
 * @title PoolFactory.sol
 * @author 0xTaiga
 */
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

interface IPool {
    function initialize(address _owner) external;
}

contract PoolFactory is Ownable{
    
    address public poolImplementationAddress;
    address public rollBackImplementation; // Keep track of old version
    bool public allowUpgrade; // Pools can only be upgraded when true

    event DeployPool(
        address _deployer,
        address _poolAddress
    );

    constructor(address _implementation) {
        poolImplementationAddress = _implementation;
        rollBackImplementation = _implementation;
    }

    function deployPool() external returns (address) {
        // Deploy the proxy that will point to our implementation.
        address pool = address(
            new ERC1967Proxy(poolImplementationAddress, "")
        );

        // Initialize the pool since constructors do not work with proxies. 
        IPool(pool).initialize(msg.sender);

        emit DeployPool(msg.sender, pool);
        return pool;
    }

    /// @notice Update the implementation of the pools
    function setImplementation(address _newImplementation) public onlyOwner {
        rollBackImplementation = poolImplementationAddress; // Update the downgrade version
        poolImplementationAddress = _newImplementation;
    }

    function flipAllowUpgrade() external onlyOwner {
        allowUpgrade = !allowUpgrade;
    }
}
