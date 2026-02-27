import { ipfsToHttp } from './formatters';

/**
 * 토큰 URI에서 메타데이터 JSON을 가져온다.
 * 이미지 경로가 상대 경로(폴더 내)일 경우 절대 ipfs:// 경로로 변환한다.
 *
 * @param {string} uri - ipfs:// 형식의 메타데이터 URI
 * @returns {Promise<object|null>} 메타데이터 객체
 */
export async function fetchMetadata(uri) {
  const url = ipfsToHttp(uri);
  if (!url) return null;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`메타데이터 fetch 실패 (${res.status})`);

  const metadata = await res.json();

  // 이미지가 상대 경로인 경우 (폴더 구조) → 절대 ipfs:// 경로로 변환
  if (
    metadata.image &&
    !metadata.image.startsWith('ipfs://') &&
    !metadata.image.startsWith('http')
  ) {
    const base = uri.substring(0, uri.lastIndexOf('/') + 1);
    metadata.image = base + metadata.image;
  }

  return metadata;
}
