# RIVALZ AUTO CLAIM 
Make sure you install :

- [NodeJS](https://nodejs.org/en/download/package-manager/current)
- [BUN](bun.sh)

usage : 

1. create .env file
2. paste the following script in the .env file
```
PRIVATE_KEY=yourprivatekey
PROVIDER_URL=https://rivalz2.rpc.caldera.xyz/infra-partner-http
CONTRACT_ADDRESS=0xebba6ffff611b7530b57ed07569e9695b98e6c82
CONTRACT_RIZ=0xf5479036c504d97f208089ff582b4af4eeafbb78
```
3. install dependency
```
bun install
```
4. run script 
```
bun run index.ts
```

_NOTE : Only works on Windows platform_
