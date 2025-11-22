// SPDX-License-Identifier: UNLICENSED 
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFT is ERC721Enumerable, Ownable {
    // 使用映射为每个 tokenId 存储独立的 URI
    mapping(uint256 => string) private _tokenURIs;

    constructor() ERC721("Troll", "Troll") Ownable(msg.sender) {}

    function mint(address to, uint256 tokenId, string memory tokenURI_) external onlyOwner {
        _mint(to, tokenId); //ERC721._mint() -> ERC721Enumerable._update(_mint调的_update是最派生版本的) -> ERC721._update(super._update调的是父合约的_update)
        _setTokenURI(tokenId, tokenURI_); 
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "tokenId does not exist");
        return _tokenURIs[tokenId];
    }

    // 内部函数：设置 token URI
    function _setTokenURI(uint256 tokenId, string memory tokenURI_) internal {
        require(!_exists(tokenId), "tokenId already exists");
        _tokenURIs[tokenId] = tokenURI_;
    }
    // 内部函数：
    function _exists(uint256 tokenId) internal view returns (bool) {
        return bytes(_tokenURIs[tokenId]).length > 0;
    }


}



