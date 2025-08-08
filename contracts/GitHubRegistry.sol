// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract GitHubRegistry {
    struct Developer {
        string githubUsername;
        address walletAddress;
        uint256 reputation;
        uint256 bountiesCompleted;
        uint256 totalEarnings;
        bool isVerified;
        uint256 registrationTime;
    }
    
    mapping(address => Developer) public developers;
    mapping(string => address) public githubToWallet;
    address[] public verifiedDevelopers;
    
    event DeveloperRegistered(
        address indexed walletAddress,
        string githubUsername,
        uint256 timestamp
    );
    
    event DeveloperVerified(
        address indexed walletAddress,
        string githubUsername
    );
    
    event ReputationUpdated(
        address indexed walletAddress,
        uint256 newReputation,
        uint256 bountiesCompleted,
        uint256 totalEarnings
    );
    
    modifier onlyUnregistered() {
        require(bytes(developers[msg.sender].githubUsername).length == 0, "Developer already registered");
        _;
    }
    
    modifier onlyRegistered() {
        require(bytes(developers[msg.sender].githubUsername).length > 0, "Developer not registered");
        _;
    }
    
    function registerDeveloper(string memory _githubUsername) external onlyUnregistered {
        require(bytes(_githubUsername).length > 0, "GitHub username cannot be empty");
        require(githubToWallet[_githubUsername] == address(0), "GitHub username already registered");
        
        developers[msg.sender] = Developer({
            githubUsername: _githubUsername,
            walletAddress: msg.sender,
            reputation: 0,
            bountiesCompleted: 0,
            totalEarnings: 0,
            isVerified: false,
            registrationTime: block.timestamp
        });
        
        githubToWallet[_githubUsername] = msg.sender;
        
        emit DeveloperRegistered(msg.sender, _githubUsername, block.timestamp);
    }
    
    function verifyDeveloper(address _walletAddress) external {
        // In a real implementation, this would be called by an oracle or authorized verifier
        // For now, we'll allow self-verification for demo purposes
        require(bytes(developers[_walletAddress].githubUsername).length > 0, "Developer not registered");
        require(!developers[_walletAddress].isVerified, "Developer already verified");
        
        developers[_walletAddress].isVerified = true;
        verifiedDevelopers.push(_walletAddress);
        
        emit DeveloperVerified(_walletAddress, developers[_walletAddress].githubUsername);
    }
    
    function updateReputation(
        address _developer,
        uint256 _bountyReward
    ) external {
        // In a real implementation, this would be called by the BugBounty contract
        require(bytes(developers[_developer].githubUsername).length > 0, "Developer not registered");
        
        developers[_developer].bountiesCompleted++;
        developers[_developer].totalEarnings += _bountyReward;
        
        // Simple reputation calculation: base score + bonus for completed bounties
        developers[_developer].reputation = 
            (developers[_developer].bountiesCompleted * 10) + 
            (developers[_developer].totalEarnings / 1 ether);
        
        emit ReputationUpdated(
            _developer,
            developers[_developer].reputation,
            developers[_developer].bountiesCompleted,
            developers[_developer].totalEarnings
        );
    }
    
    function getDeveloper(address _walletAddress) external view returns (Developer memory) {
        return developers[_walletAddress];
    }
    
    function getWalletByGitHub(string memory _githubUsername) external view returns (address) {
        return githubToWallet[_githubUsername];
    }
    
    function getVerifiedDevelopers() external view returns (address[] memory) {
        return verifiedDevelopers;
    }
    
    function isVerifiedDeveloper(address _walletAddress) external view returns (bool) {
        return developers[_walletAddress].isVerified;
    }
    
    function getLeaderboard() external view returns (address[] memory, uint256[] memory) {
        uint256 length = verifiedDevelopers.length;
        address[] memory addresses = new address[](length);
        uint256[] memory reputations = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            addresses[i] = verifiedDevelopers[i];
            reputations[i] = developers[verifiedDevelopers[i]].reputation;
        }
        
        // Simple bubble sort for demonstration (not gas efficient for large arrays)
        for (uint256 i = 0; i < length - 1; i++) {
            for (uint256 j = 0; j < length - i - 1; j++) {
                if (reputations[j] < reputations[j + 1]) {
                    // Swap reputations
                    uint256 tempRep = reputations[j];
                    reputations[j] = reputations[j + 1];
                    reputations[j + 1] = tempRep;
                    
                    // Swap addresses
                    address tempAddr = addresses[j];
                    addresses[j] = addresses[j + 1];
                    addresses[j + 1] = tempAddr;
                }
            }
        }
        
        return (addresses, reputations);
    }
}

