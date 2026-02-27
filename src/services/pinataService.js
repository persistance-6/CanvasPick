/**
 * Pinata IPFS 업로드 서비스
 *
 * 환경 변수:
 *   VITE_PINATA_JWT      — Pinata API Keys 페이지에서 발급한 JWT
 *   VITE_PINATA_GROUP_ID — (선택) 업로드된 폴더를 정리할 Pinata Group ID
 */

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const PINATA_GROUP_ID = import.meta.env.VITE_PINATA_GROUP_ID;

// 클래식 Pinning API — 폴더(wrapWithDirectory) 업로드용
const PINATA_PIN_FILE_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';

// Pinning API — 핀 목록 조회용
const PINATA_PIN_LIST_URL = 'https://api.pinata.cloud/data/pinList';

// Groups API — 그룹 관리용
const PINATA_GROUPS_URL = 'https://api.pinata.cloud/groups';

/**
 * 업로드된 핀을 Pinata 그룹에 추가한다.
 * pinList에서 CID로 핀 ID를 조회한 뒤, Groups API로 그룹에 추가한다.
 *
 * @param {string} cid     - 업로드된 폴더의 CID
 * @param {string} groupId - 추가할 Pinata Group ID
 */
async function addToGroup(cid, groupId) {
    // Groups API: CID를 그룹에 추가
    const addRes = await fetch(`${PINATA_GROUPS_URL}/${groupId}/cids`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${PINATA_JWT}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cids: [cid] }),
    });

    if (!addRes.ok) {
        const err = await addRes.json().catch(() => ({}));
        console.warn('그룹 추가 실패:', addRes.status, err);
    }
}

/**
 * 이미지 + 메타데이터를 하나의 IPFS 폴더에 묶어 업로드한다.
 *
 * 1) 클래식 Pinning API로 폴더 업로드 (wrapWithDirectory)
 * 2) GROUP_ID가 설정되어 있으면 Files API v3로 해당 폴더를 그룹에 추가
 *
 * 결과 폴더 구조:
 *   ipfs://folderCID/image.{ext}
 *   ipfs://folderCID/metadata.json
 *
 * @param {File} imageFile - 업로드할 이미지 파일
 * @param {{
 *   name: string,
 *   description: string,
 *   artistId: string,
 *   pricePerShare: string,
 *   storageLocation: string,
 *   artId: number|string,
 * }} metadata
 * @returns {Promise<string>} "ipfs://<폴더CID>/metadata.json"
 */
export async function uploadArtwork(imageFile, metadata) {
    const { name, description, artistId, pricePerShare, storageLocation, artId } = metadata;

    // 이미지 확장자 추출
    const imageExt = imageFile.name.split('.').pop();
    const imageName = `image.${imageExt}`;

    // 메타데이터 JSON (이미지는 같은 폴더 내 상대 경로)
    const metadataJson = {
        name,
        description: description || `${name} — by ${artistId}. CanvasPick 분할 소유 NFT.`,
        image: imageName,
        attributes: [
            { trait_type: 'Artist',           value: artistId },
            { trait_type: 'Price Per Share',  value: `${pricePerShare} ETH` },
            { trait_type: 'Storage Location', value: storageLocation },
        ],
    };

    const metadataBlob = new Blob(
        [JSON.stringify(metadataJson, null, 2)],
        { type: 'application/json' },
    );

    // FormData — 폴더 경로를 포함하여 파일 추가
    const folderName = artId != null ? String(artId) : name;
    const formData = new FormData();
    formData.append('file', imageFile, `${folderName}/${imageName}`);
    formData.append('file', metadataBlob, `${folderName}/metadata.json`);

    // Pinata 옵션 — 파일 경로에 이미 폴더명이 포함되어 있으므로 추가 래핑 불필요
    const options = { cidVersion: 1, wrapWithDirectory: false };

    formData.append('pinataMetadata', JSON.stringify({ name: folderName }));
    formData.append('pinataOptions', JSON.stringify(options));

    // ── Step 1: 클래식 Pinning API로 폴더 업로드 ──────────
    const res = await fetch(PINATA_PIN_FILE_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${PINATA_JWT}` },
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.details ?? `폴더 업로드 실패 (${res.status})`);
    }

    const { IpfsHash } = await res.json();

    // ── Step 2: 업로드된 폴더를 그룹에 추가 (실패해도 민팅은 진행) ──
    if (PINATA_GROUP_ID) {
        await addToGroup(IpfsHash, PINATA_GROUP_ID).catch((err) =>
            console.warn('그룹 추가 중 오류 (무시됨):', err),
        );
    }

    return `ipfs://${IpfsHash}/metadata.json`;
}
