import { ethers } from 'ethers';

export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatEth = (wei) => {
  if (!wei) return '0';
  return parseFloat(ethers.formatEther(wei)).toFixed(6);
};

export const formatPrice = (wei) => {
  if (!wei) return '0 ETH';
  return `${formatEth(wei)} ETH`;
};

export const formatPercentage = (amount, total) => {
  if (!total || total === 0) return '0%';
  return ((amount / total) * 100).toFixed(2) + '%';
};

export const formatTokenAmount = (amount) => {
  if (!amount) return '0';
  return parseInt(amount).toLocaleString();
};
