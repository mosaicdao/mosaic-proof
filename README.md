# Mosaic proof

Mosaic is a parallelization schema for decentralized applications. 
It composes heterogeneous blockchain systems into one another. 
Decentralized applications can use Mosaic to compute over a composed network 
of multiple blockchain systems in parallel. More details are of mosaic is [here](https://github.com/OpenST/mosaic-contracts/blob/develop/README.md)

The protocol defines a set of actions that together perform atomic token 
transfers across two blockchains using gateway contracts. 
This is done using a 2-phase message passing architecture between the chains.
This is done with proving Merkle patricia proofs of messages generated from one
chain to another chain.
 


**Mosaic proof** is a tool for generating merkle patricia proof of message 
that is used by the protocol for message transfers.
 
 ###Usage
install `@openst/mosaic-proof` package.
 ```typescript
npm install @openst/mosaic-proof
```
Using proof generator.
 ```typescript
import { ProofGenerator } from '@openst/mosaic-proof';
```

Create proof generator object.
```typescript
const web3 = new Web3('http://localhost:8546');
const proofGenerator = new ProofGenerator(web3);
```
Generate message box outbox proof for a given message
```typescript
const eip20GatewayAddress = '0xEIP20GatewayAddress000000000000000000000';
const messageHash = '0xMessageHash000000000000000000000000000000000000000000000000000';
const blockNumber = 'latest';

// Get MessageBox outbox proof.
const outboxProof:ProofData = await proofGenerator.getOutboxProof(
    eip20GatewayAddress,
    [messageHash], 
    blockNumber,
  );
```
Generate message box inbox proof for a given message
```typescript
// Get MessageBox outbox proof.
const inboxProof: ProofData = await proofGenerator.getInboxProof(
    eip20GatewayAddress,
    [messageHash], 
    blockNumber,
  );

```
