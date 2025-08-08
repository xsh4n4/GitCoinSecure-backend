// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract BugBounty {
    enum Status { Active, Submitted, Approved, Rejected, Paid }
    
    struct Submission {
        address hunter;
        string ipfsHash;
        uint256 timestamp;
        Status status;
        string feedback;
    }
    
    address public owner;
    string public title;
    string public description;
    uint256 public reward;
    uint256 public deadline;
    string public severity;
    Status public status;
    
    Submission[] public submissions;
    mapping(address => uint256[]) public hunterSubmissions;
    
    event SubmissionCreated(
        uint256 indexed submissionId,
        address indexed hunter,
        string ipfsHash
    );
    
    event SubmissionApproved(
        uint256 indexed submissionId,
        address indexed hunter,
        uint256 reward
    );
    
    event SubmissionRejected(
        uint256 indexed submissionId,
        string feedback
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyActive() {
        require(status == Status.Active, "Bounty is not active");
        require(block.timestamp <= deadline, "Bounty deadline has passed");
        _;
    }
    
    constructor(
        address _owner,
        string memory _title,
        string memory _description,
        uint256 _deadline,
        string memory _severity
    ) payable {
        owner = _owner;
        title = _title;
        description = _description;
        reward = msg.value;
        deadline = _deadline;
        severity = _severity;
        status = Status.Active;
    }
    
    function submitBug(string memory _ipfsHash) external onlyActive {
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        
        uint256 submissionId = submissions.length;
        submissions.push(Submission({
            hunter: msg.sender,
            ipfsHash: _ipfsHash,
            timestamp: block.timestamp,
            status: Status.Submitted,
            feedback: ""
        }));
        
        hunterSubmissions[msg.sender].push(submissionId);
        
        emit SubmissionCreated(submissionId, msg.sender, _ipfsHash);
    }
    
    function approveSubmission(uint256 _submissionId) external onlyOwner {
        require(_submissionId < submissions.length, "Invalid submission ID");
        require(submissions[_submissionId].status == Status.Submitted, "Submission not in submitted state");
        require(address(this).balance >= reward, "Insufficient contract balance");
        
        submissions[_submissionId].status = Status.Approved;
        status = Status.Paid;
        
        address hunter = submissions[_submissionId].hunter;
        payable(hunter).transfer(reward);
        
        emit SubmissionApproved(_submissionId, hunter, reward);
    }
    
    function rejectSubmission(uint256 _submissionId, string memory _feedback) external onlyOwner {
        require(_submissionId < submissions.length, "Invalid submission ID");
        require(submissions[_submissionId].status == Status.Submitted, "Submission not in submitted state");
        
        submissions[_submissionId].status = Status.Rejected;
        submissions[_submissionId].feedback = _feedback;
        
        emit SubmissionRejected(_submissionId, _feedback);
    }
    
    function withdrawFunds() external onlyOwner {
        require(block.timestamp > deadline, "Bounty deadline has not passed");
        require(status == Status.Active, "Bounty is not active");
        
        status = Status.Rejected;
        payable(owner).transfer(address(this).balance);
    }
    
    function getSubmissions() external view returns (Submission[] memory) {
        return submissions;
    }
    
    function getSubmissionsByHunter(address _hunter) external view returns (uint256[] memory) {
        return hunterSubmissions[_hunter];
    }
    
    function getSubmissionCount() external view returns (uint256) {
        return submissions.length;
    }
    
    function getBountyInfo() external view returns (
        address,
        string memory,
        string memory,
        uint256,
        uint256,
        string memory,
        Status
    ) {
        return (owner, title, description, reward, deadline, severity, status);
    }
}

