// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BugBounty.sol";

contract BugBountyFactory {
    address[] public bounties;
    mapping(address => address[]) public bountyOwners;
    
    event BountyCreated(
        address indexed bountyAddress,
        address indexed owner,
        string title,
        uint256 reward,
        uint256 deadline
    );
    
    function createBounty(
        string memory _title,
        string memory _description,
        uint256 _deadline,
        string memory _severity
    ) external payable returns (address) {
        require(msg.value > 0, "Bounty reward must be greater than 0");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        
        BugBounty newBounty = new BugBounty{value: msg.value}(
            msg.sender,
            _title,
            _description,
            _deadline,
            _severity
        );
        
        address bountyAddress = address(newBounty);
        bounties.push(bountyAddress);
        bountyOwners[msg.sender].push(bountyAddress);
        
        emit BountyCreated(
            bountyAddress,
            msg.sender,
            _title,
            msg.value,
            _deadline
        );
        
        return bountyAddress;
    }
    
    function getBounties() external view returns (address[] memory) {
        return bounties;
    }
    
    function getBountiesByOwner(address _owner) external view returns (address[] memory) {
        return bountyOwners[_owner];
    }
    
    function getBountyCount() external view returns (uint256) {
        return bounties.length;
    }
}

