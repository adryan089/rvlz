import { ethers, isError } from "ethers";
import dotenv from "dotenv";
import axios from "axios";
import chalk from "chalk"; 
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
    process.stdout.write(chalk.green("Signature request initiated successfully.") + "\r");
    return {
      address: wallet.address,
      signature,
      dataSign,
      referralId: "",
    };
  } catch {
    process.stdout.write(chalk.red("Error signing data.") + "\r");
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
    return fragmentCount;
  } catch {
    process.stdout.write(chalk.red("Error checking claimable fragments.") + "\r");
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
    process.stdout.write(chalk.green("Logged in successfully with wallet.") + "\r");
    return response.data.data.accessToken;
  } catch {
    process.stdout.write(chalk.red("Error logging in with wallet.") + "\r");
    throw new Error("Failed to log in with wallet");
  }
}

async function getScore(): Promise<{ fragments: Fragments; intelDiscount: number }> {
  try {
    const url = `https://api.rivalz.ai/fragment/v1/fragment/collection/${wallet.address}`;
    const headers = {
      accept: "application/json",
    };
    const response = await axios.get(url, { headers });
    const data = response.data as Fragments;
    const intelDiscount = data.intelDiscount; 

    process.stdout.write(chalk.green("Wallet Authorization Successfuly!.") + "\r");

    return { fragments: data, intelDiscount };
  } catch {
    process.stdout.write(chalk.red("Error retrieving score and Intel Discount.") + "\r");
    throw new Error("Failed to retrieve score and Intel Discount");
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
    process.stdout.write(chalk.green("Wallet address found successfully.") + "\r");
    return response.data as NodeInfo;
  } catch {
    process.stdout.write(chalk.red("Error finding by wallet address.") + "\r");
    throw new Error("Failed to find by wallet address");
  }
}

function getRandomNonce(min: number, max: number): string {
  const nonce = Math.floor(Math.random() * (max - min + 1)) + min;
  process.stdout.write(chalk.green(`Generated random nonce: ${nonce}`) + "\r");
  return nonce.toString().padStart(2, "0"); 
}

async function getRiz() {
  try {
    process.stdout.write(chalk.green("Adding Riz for claim...") + "\r");
    const tx = await contractRiz.claim();
    process.stdout.write(chalk.green("Transaction hash:" + tx.hash) + "\r");
    const tx_complete = await tx.wait();
    process.stdout.write(chalk.green("Transaction confirmed:" + tx_complete.hash) + "\r");
  } catch {
    process.stdout.write(chalk.red("Error claiming Riz.") + "\r");
  }
}

async function callClaim() {
  try {
    process.stdout.write(chalk.green("Calling claim function...") + "\r");
    const tx = await contract.claim();
    process.stdout.write(chalk.green("Transaction hash:" + tx.hash) + "\r");
    const tx_complete = await tx.wait();
    process.stdout.write(chalk.green("Transaction confirmed:" + tx_complete.hash) + "\r");
    return tx_complete.hash;
  } catch {
    process.stdout.write(chalk.red("Error during claim call.") + "\r");
    throw new Error("Failed to execute claim call");
  }
}

async function executeProcess() {
  let totalClaimed = 0;
  try {
    const { fragments, intelDiscount } = await getScore();

    // Menampilkan informasi awal
    console.log(chalk.white(`\nWallet Address: ${wallet.address}`));
    console.log(chalk.cyan(`Jumlah Fragment: ${await checkClaimAble()}`));
    console.log(chalk.cyan(`Jumlah Intel Discount: ${intelDiscount}`));

    while ((await checkClaimAble()) > 0) {
      try {
        await callClaim();
        totalClaimed++;
        console.log(chalk.blue(`Total fragments claimed: ${totalClaimed}`)); 
      } catch {
        process.stdout.write(chalk.red("Error calling claim function.") + "\r");
      }
    }
  } catch {
    process.stdout.write(chalk.red("Error in execute process.") + "\r");
    exit(1);
  }
}

function displayRemainingTime(millisecondsLeft: number, callback: () => void) {
  let secondsLeft = Math.floor(millisecondsLeft / 1000);
  const intervalId = setInterval(() => {
    if (secondsLeft <= 0) {
      clearInterval(intervalId);
      callback(); 
      return;
    }

    secondsLeft -= 1;
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;

    process.stdout.write(
      `\r${chalk.yellow(
        `Claim selanjutnya dalam : ${minutes}m ${seconds}s`
      )}`
    );
  }, 1000);
}


async function main() {
  console.clear();
  await executeProcess();

  const delayInMilliseconds = 5 * 60 * 1000;
  displayRemainingTime(delayInMilliseconds, async () => { 
    await main();
  });
}


main();
