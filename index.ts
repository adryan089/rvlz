import { ethers, isError } from "ethers";
import dotenv from "dotenv";
import axios from "axios";
import chalk from "chalk"; // Import chalk untuk menambahkan warna ke output konsol
import type { NodeInfo } from "./response";
import type { Fragments } from "./responseFragment";
import { exit } from "process";

dotenv.config();

const {
  PROVIDER_URL: providerUrl,
  PRIVATE_KEY: privateKey,
  CONTRACT_ADDRESS: contractAddress,
  CONTRACT_RIZ: contractAddressRiz,
} = process.env;

if (!providerUrl || !privateKey || !contractAddress || !contractAddressRiz) {
  console.error(
    chalk.red(
      "Please set PROVIDER_URL, PRIVATE_KEY, CONTRACT_ADDRESS, CONTRACT_RIZ in the .env file."
    )
  );
  throw new Error("Environment variables missing");
}

const provider = new ethers.JsonRpcProvider(providerUrl);
const wallet = new ethers.Wallet(privateKey, provider);

const contractABI = [
  {
    inputs: [],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const contract = new ethers.Contract(contractAddress, contractABI, wallet);
const contractRiz = new ethers.Contract(contractAddressRiz, contractABI, wallet);

async function initiateSignatureRequest(): Promise<object> {
  try {
    const currentTimestamp = Math.floor(Date.now());
    const dataSign = `Sign in to Rivalz with OTP: ${currentTimestamp}`;
    const signature = await wallet.signMessage(dataSign);
    console.log(chalk.green("Signature request initiated successfully."));
    return {
      address: wallet.address,
      signature,
      dataSign,
      referralId: "",
    };
  } catch {
    console.error(chalk.red("Error signing data."));
    throw new Error("Failed to sign data");
  }
}

async function checkClaimAble() {
  try {
    const data = `0x89885049000000000000000000000000${wallet.address.replace(
      "0x",
      ""
    )}`;
    const response = await provider.call({
      from: `0x24edfad36015420a84573684644f6dc74f0ba8c5`,
      to: contractAddress,
      data,
    });
    const fragmentCount = parseInt(response);
    console.log(chalk.green(`Claimable fragments: ${fragmentCount}`));
    return fragmentCount;
  } catch {
    console.error(chalk.red("Error checking claimable fragments."));
    throw new Error("Failed to check claimable fragments");
  }
}

async function loginWithWallet(data: object): Promise<string> {
  try {
    const url = `https://be.rivalz.ai/api-v1/auth/login-with-wallet`;
    const headers = {
      accept: "application/json",
      authorization: "Bearer null",
      "content-type": "application/json; charset=UTF-8",
    };
    const response = await axios.post(url, JSON.stringify(data), { headers });
    console.log(chalk.green("Logged in successfully with wallet."));
    return response.data.data.accessToken;
  } catch {
    console.error(chalk.red("Error logging in with wallet."));
    throw new Error("Failed to log in with wallet");
  }
}

async function getScore(): Promise<Fragments> {
  try {
    const url = `https://api.rivalz.ai/fragment/v1/fragment/collection/${wallet.address}`;
    const headers = {
      accept: "application/json",
    };
    const response = await axios.get(url, { headers });
    console.log(chalk.green("Score retrieved successfully."));
    return response.data as Fragments;
  } catch {
    console.error(chalk.red("Error retrieving score."));
    throw new Error("Failed to retrieve score");
  }
}

async function findByWalletAddress(token: string): Promise<NodeInfo> {
  const url = `https://be.rivalz.ai/api-v1/orbit-db/find-by-wallet-address/${wallet.address}`;
  const headers = {
    accept: "application/json",
    authorization: `Bearer ${token}`,
  };
  try {
    const response = await axios.get(url, { headers });
    console.log(chalk.green("Wallet address found successfully."));
    return response.data as NodeInfo;
  } catch {
    console.error(chalk.red("Error finding by wallet address."));
    throw new Error("Failed to find by wallet address");
  }
}

function getRandomNonce(min: number, max: number): string {
  const nonce = Math.floor(Math.random() * (max - min + 1)) + min;
  console.log(chalk.green(`Generated random nonce: ${nonce}`));
  return nonce.toString().padStart(2, "0"); // Ensures the nonce is always two digits
}

async function getRiz() {
  try {
    console.log(chalk.green("Adding Riz for claim..."));
    const tx = await contractRiz.claim();
    console.log(chalk.green("Transaction hash:"), tx.hash);
    const tx_complete = await tx.wait();
    console.log(chalk.green("Transaction confirmed:"), tx_complete.hash);
  } catch {
    console.error(chalk.red("Error claiming Riz."));
  }
}

async function callClaim() {
  try {
    console.log(chalk.green("Calling claim function..."));
    const tx = await contract.claim();
    console.log(chalk.green("Transaction hash:"), tx.hash);
    const tx_complete = await tx.wait();
    console.log(chalk.green("Transaction confirmed:"), tx_complete.hash);
    return tx_complete.hash;
  } catch {
    console.error(chalk.red("Error during claim call."));
    throw new Error("Failed to execute claim call");
  }
}

async function executeProcess() {
  try {
    while ((await checkClaimAble()) > 0) {
      try {
        await callClaim();
      } catch {
        console.error(chalk.red("Error Proses Claim"));
      }
    }
  } catch {
    console.error(chalk.red("Error in execute process."));
    exit(1);
  }
}

function displayRemainingTime(millisecondsLeft: number) {
  let secondsLeft = Math.floor(millisecondsLeft / 1000);
  const intervalId = setInterval(() => {
    if (secondsLeft <= 0) {
      clearInterval(intervalId);
      return;
    }

    secondsLeft -= 1;
    const hours = Math.floor(secondsLeft / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);
    const seconds = secondsLeft % 60;

    process.stdout.write(
      `\r${chalk.yellow(
        `Waktu yang tersisa sebelum menjalankan proses lagi: ${hours}h ${minutes}m ${seconds}s`
      )}`
    );
  }, 1000);
}

async function main() {
  
  await executeProcess();

  const delayInMilliseconds = 5 * 60 * 1000; 
  console.log(chalk.purple("\nProses selesai. Menunggu 5 menit sebelum menjalankan lagi..."));

  displayRemainingTime(delayInMilliseconds);

  setTimeout(async () => {
    console.log(chalk.purple("\nWaktu tunggu selesai. Menjalankan proses lagi..."));
    await main(); 
  }, delayInMilliseconds);
}

main();
