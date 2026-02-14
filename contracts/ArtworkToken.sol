// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.0;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ArtworkToken is ERC721, Ownable {
    struct Artwork {
        uint256 tokenId;
        string name;
        string artist;
        string location;
        uint32 creationDate;
        uint256 pricePerPiece;
    }

    uint256 public nextTokenId = 1;

    mapping (uint256 => Artwork) public artworks;

    constructor() ERC721("ArtworkToken", "ARTWORK") Ownable(msg.sender) {}

    function registerArtwork(
        string memory name,
        string memory artist,
        string memory location,
        uint32 creationDate,
        uint256 pricePerPiece
    ) public onlyOwner returns (uint256) {
        require(bytes(name).length > 0, "Name is required");
        require(bytes(artist).length > 0, "Artist is required");
        require(bytes(location).length > 0, "Location is required");
        require(creationDate > 0, "Creation date is required");
        require(pricePerPiece > 0, "Price per piece must be greater than zero");

        // Mint the artwork NFT to the owner
        _mint(msg.sender, nextTokenId);
        
        artworks[nextTokenId] = Artwork({
            tokenId: nextTokenId,
            name: name,
            artist: artist,
            location: location,
            creationDate: creationDate,
            pricePerPiece: pricePerPiece
        });

        nextTokenId++;
        return nextTokenId - 1;
    }

    function getArtwork(uint256 tokenId) public view returns (Artwork memory) {
        require(artworks[tokenId].tokenId > 0, "Artwork does not exist");
        return artworks[tokenId];
    }
}