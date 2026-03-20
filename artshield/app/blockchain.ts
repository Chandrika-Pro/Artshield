import { ethers } from "ethers";

// Your deployed contract address
export const CONTRACT_ADDRESS = "0xd9145CCE52D386f254917e481eB44e9943F39138";

// Contract ABI — tells frontend how to talk to the contract
export const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: "string", name: "_phash", type: "string" },
      { internalType: "string", name: "_ownerName", type: "string" },
      { internalType: "string", name: "_ownerEmail", type: "string" },
    ],
    name: "registerArtwork",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_phash", type: "string" }],
    name: "getArtwork",
    outputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "string", name: "ownerName", type: "string" },
      { internalType: "string", name: "ownerEmail", type: "string" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "bool", name: "exists", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalArtworks",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

// Get contract instance
export const getContract = async () => {
  if (typeof window === "undefined") return null;

  const { ethereum } = window as any;

  if (!ethereum) {
    alert("Please install MetaMask!");
    return null;
  }

  await ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.BrowserProvider(ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

  return contract;
};