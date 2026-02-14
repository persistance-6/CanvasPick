import { expect } from "chai";
import { ethers } from "hardhat";

describe("ArtworkToken", function () {
  let artworkToken;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const ArtworkToken = await ethers.getContractFactory("ArtworkToken");
    artworkToken = await ArtworkToken.deploy();
    await artworkToken.deployed();
  });

  it("deploys", async function () {
    expect(artworkToken.address).to.be.a("string");
  });

  it("registers artwork and stores metadata", async function () {
    const tx = await artworkToken.registerArtwork(
      "별이 빛나는 밤",
      "빈센트 반 고흐",
      "뉴욕 현대미술관",
      1889,
      100
    );
    await tx.wait();

    const artwork = await artworkToken.getArtwork(1);
    expect(artwork.name).to.equal("별이 빛나는 밤");
    expect(artwork.artist).to.equal("빈센트 반 고흐");
    expect(artwork.location).to.equal("뉴욕 현대미술관");
    expect(artwork.creationDate).to.equal(1889);
  });

  it("assigns NFT ownership to deployer and increments nextTokenId", async function () {
    await artworkToken.registerArtwork("A", "B", "C", 2000, 50);
    const ownerOf1 = await artworkToken.ownerOf(1);
    expect(ownerOf1).to.equal((await ethers.getSigners())[0].address);

    const nextId = await artworkToken.nextTokenId();
    expect(nextId).to.equal(2);
  });

  it("only owner can registerArtwork", async function () {
    await expect(
      artworkToken.connect(addr1).registerArtwork("X", "Y", "Z", 2020, 10)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });
});
