/**
 * Pinata IPFS 업로드 서비스
 *
 * 환경 변수:
 *   VITE_PINATA_JWT — Pinata API Keys 페이지에서 발급한 JWT
 */

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

const PINATA_PIN_FILE_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const PINATA_PIN_JSON_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';

/**
 * 이미지 파일을 Pinata에 업로드하고 ipfs:// URI를 반환한다.
 * @param {File} file - 업로드할 이미지 파일
 * @returns {Promise<string>} "ipfs://<CID>"
 */
export async function uploadImageToIPFS(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append(
        'pinataMetadata',
        JSON.stringify({ name: file.name })
    );
    formData.append(
        'pinataOptions',
        JSON.stringify({ cidVersion: 1 })
    );

    const res = await fetch(PINATA_PIN_FILE_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${PINATA_JWT}` },
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.details ?? `이미지 업로드 실패 (${res.status})`);
    }

    const data = await res.json();
    return `ipfs://${data.IpfsHash}`;
}

/**
 * NFT 메타데이터 JSON을 Pinata에 업로드하고 ipfs:// URI를 반환한다.
 * ERC-721/OpenSea 메타데이터 표준을 따른다.
 *
 * @param {{
 *   name: string,
 *   description: string,
 *   artistId: string,
 *   pricePerShare: string,
 *   imageUri: string,
 *   storageLocation: string,
 * }} metadata
 * @returns {Promise<string>} "ipfs://<CID>"
 */
export async function uploadMetadataToIPFS(metadata) {
    const { name, description, artistId, pricePerShare, imageUri, storageLocation } = metadata;

    const json = {
        name,
        description: description || `${name} — by ${artistId}. CanvasPick 분할 소유 NFT.`,
        image: imageUri,
        attributes: [
            { trait_type: 'Artist',           value: artistId },
            { trait_type: 'Price Per Share',  value: `${pricePerShare} ETH` },
            { trait_type: 'Storage Location', value: storageLocation },
        ],
    };

    const body = {
        pinataContent: json,
        pinataMetadata: { name: `${name}_metadata.json` },
        pinataOptions: { cidVersion: 1 },
    };

    const res = await fetch(PINATA_PIN_JSON_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${PINATA_JWT}`,
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.details ?? `메타데이터 업로드 실패 (${res.status})`);
    }

    const data = await res.json();
    return `ipfs://${data.IpfsHash}`;
}
