// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * ReputationBond
 * Minimal staking + slashing contract for hackathon demo purposes.
 * A single trusted resolver (the orchestrator backend) reports task
 * outcomes; failures slash a portion of the provider's bond to a pool.
 *
 * NOT production-hardened: no dispute window, no decentralized oracle.
 * That's intentionally out of scope for the two-week build — see
 * ARCHITECTURE.md roadmap.
 */
contract ReputationBond is Ownable {
    IERC20 public immutable usdc;
    address public resolver;
    address public slashPool;

    mapping(address => uint256) public bonded;

    event Staked(address indexed provider, uint256 amount);
    event Withdrawn(address indexed provider, uint256 amount);
    event OutcomeRecorded(address indexed provider, bytes32 taskId, bool success, uint256 slashedAmount);

    constructor(address _usdc, address _resolver, address _slashPool) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        resolver = _resolver;
        slashPool = _slashPool;
    }

    modifier onlyResolver() {
        require(msg.sender == resolver, "not resolver");
        _;
    }

    function stake(uint256 amount) external {
        require(amount > 0, "amount=0");
        usdc.transferFrom(msg.sender, address(this), amount);
        bonded[msg.sender] += amount;
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(bonded[msg.sender] >= amount, "insufficient bond");
        bonded[msg.sender] -= amount;
        usdc.transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function recordOutcome(
        address provider,
        bytes32 taskId,
        bool success,
        uint256 slashBps
    ) external onlyResolver {
        uint256 slashed = 0;
        if (!success) {
            slashed = (bonded[provider] * slashBps) / 10_000;
            if (slashed > 0) {
                bonded[provider] -= slashed;
                usdc.transfer(slashPool, slashed);
            }
        }
        emit OutcomeRecorded(provider, taskId, success, slashed);
    }

    function setResolver(address _resolver) external onlyOwner {
        resolver = _resolver;
    }
}
