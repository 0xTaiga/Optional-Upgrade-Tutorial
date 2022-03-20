//SPDX-License-Identifier: Unlicense
/**
 * @title PoolImplementation.sol
 * @author 0xTaiga
 */
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

interface IPoolFactory {
    function poolImplementationAddress() external view returns (address);
    function rollBackImplementation() external view returns (address);
    function allowUpgrade() external view returns (bool);
}


contract PoolImplementation is UUPSUpgradeable, OwnableUpgradeable {
    
    IPoolFactory public factory;

    /// @notice Error for if illegal upgrade implementation
    error IllegalImplementation();
    /// @notice Error for if upgrades are not allowed at this time
    error UpgradeNotAllowed();

    function initialize(address _owner) external initializer {
        __UUPSUpgradeable_init();
        __Ownable_init();
        // We want the lender to be the owner of the contract not the factory
        transferOwnership(_owner); 
        factory = IPoolFactory(msg.sender);
    }

    function _authorizeUpgrade(address _newImplementation) internal view override onlyOwner {
        if (_newImplementation != factory.poolImplementationAddress() 
             && _newImplementation != factory.rollBackImplementation()) revert IllegalImplementation();
        if (!factory.allowUpgrade()) revert UpgradeNotAllowed();
    }

    function version() external pure returns (uint256) {
        return 1;
    }
}