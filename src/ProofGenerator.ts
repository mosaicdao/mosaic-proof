// Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import Web3 from 'web3';
import * as Web3Utils from 'web3-utils';
import { GetProof } from 'web3-eth';

const RLP = require('rlp');

// This is the position of message outbox defined in GatewayBase.sol
const MESSAGE_OUTBOX_OFFSET = '9';

// This is the position of message inbox defined in GatewayBase.sol
const MESSAGE_INBOX_OFFSET = 'a';

class ProofGenerator {
  /** Web3 object for blockchain */
  public readonly web3: Web3;

  /**
   * @param web3 Web3 instance connected to block chain.
   */
  public constructor(web3: Web3) {
    this.web3 = web3;
  }

  /**
   * Get proof for inbox
   * @param address Address of ethereum account for which proof needs to be generated.
   * @param keys Array of keys of mapping in solidity.
   * @param blockNumber Block number in hex.
   * @param messageInboxOffset Message bus inbox offset.
   * @return Promise that resolves to proof object.
   */
  public async getInboxProof(
    address: string,
    keys: string[] = [],
    blockNumber?: string,
    messageInboxOffset?: string,
  ): Promise<ProofData> {
    return ProofGenerator.getProof(
      this.web3,
      messageInboxOffset || MESSAGE_INBOX_OFFSET,
      address,
      keys,
      blockNumber,
    );
  }

  /**
   * Get proof for outbox.
   * @param address Address of ethereum account for which proof needs to be generated.
   * @param keys Array of keys for a mapping in solidity.
   * @param blockNumber Block number in hex.
   * @param messageOutboxOffset Message bus outbox offset.
   * @return Promise that resolves to proof object.
   */
  public async getOutboxProof(
    address: string,
    keys: string[] = [],
    blockNumber?: string,
    messageOutboxOffset?: string,
  ): Promise<ProofData> {
    return ProofGenerator.getProof(
      this.web3,
      messageOutboxOffset || MESSAGE_OUTBOX_OFFSET,
      address,
      keys,
      blockNumber,
    );
  }

  /**
   * Get proof data, if blockNumber is not passed it will generate proof for latest block.
   * @param web3 web3 instance of chain from which proof is generated.
   * @param index Storage index.
   * @param address Address of ethereum account for which proof needs to be generated.
   * @param keys Array of keys for a mapping in solidity.
   * @param blockNumber Block number in hex.
   * @return Promise that resolves to proof object.
   */
  private static async getProof(
    web3: Web3,
    index: string,
    address: string,
    keys: string[],
    blockNumber?: string,
  ): Promise<ProofData> {
    let proofBlockNumber = blockNumber;
    if (!proofBlockNumber) {
      const block = await web3.eth.getBlock('latest');
      proofBlockNumber = web3.utils.toHex(block.number);
    }
    const storageKey = ProofGenerator.storagePath(index, keys);
    return ProofGenerator.fetchProof(web3, address, [storageKey], proofBlockNumber).then(
      async (proof: ProofData): Promise<ProofData> => {
        const proofData = proof;
        proofData.block_number = proofBlockNumber;
        return proofData;
      },
    );
  }

  /**
   * Fetch proof from geth RPC call and serialize it in desired format.
   * @param web3 web3 instance of chain from which proof is generated.
   * @param address Address of ethereum account for which proof needs to be generated.
   * @param storageKeys Array of keys for a mapping in solidity.
   * @param blockNumber Block number in hex.
   * @return Promise that resolves to proof object.
   */
  private static async fetchProof(
    web3: Web3,
    address: string,
    storageKeys: string[] = [],
    blockNumber: string = 'latest',
  ): Promise<ProofData> {
    return new Promise((resolve, reject): void => {
      web3.eth.getProof(
        address,
        storageKeys,
        blockNumber,
        (error: Error, result: GetProof): void => {
          if (result) {
            try {
              // `as any as` is used here because as per the code, the result
              // should be of type GetProof, but its returning GetProof.result.
              const proofData = result as any as ProofData;

              proofData.serializedAccountProof = ProofGenerator.serializeProof(
                proofData.accountProof,
              );
              proofData.encodedAccountValue = ProofGenerator.encodedAccountValue(
                proofData.serializedAccountProof,
              );

              proofData.storageProof.forEach((sp: StorageProof): void => {
              /* eslint no-param-reassign: "error" */
                sp.serializedProof = ProofGenerator.serializeProof(sp.proof);
              });
              resolve(proofData);
            } catch (exception) {
              reject(exception);
            }
            reject(error);
          }
        },
      );
    });
  }

  /**
   * Provides storage path.
   * @param storageIndex Position of storage in the contract.
   * @param mappings List of keys in case storage is mapping.
   * @return Storage path.
   */
  private static storagePath(
    storageIndex: string,
    mappings: string[],
  ): string {
    let path = '';

    if (mappings && mappings.length > 0) {
      mappings.map((mapping): string => {
        path = `${path}${Web3Utils.padLeft(mapping, 64)}`;
        return path;
      });
    }

    path = `${path}${Web3Utils.padLeft(storageIndex, 64)}`;
    path = Web3Utils.sha3(path);

    return path;
  }

  /**
   * Flatten the array of nodes.
   * @param proof Array of nodes representing merkel proof.
   * @return Serialized proof.
   */
  private static serializeProof(proof: string[]): string {
    const serializedProof: Buffer[] = [];
    proof.forEach((p: string): void => { serializedProof.push(RLP.decode(p)); });
    return `0x${RLP.encode(serializedProof).toString('hex')}`;
  }

  /**
   * Fetch rlp encoded account value (nonce, balance, code hash, storageRoot)
   * @param accountProof Account proof.
   * @return Encoded string.
   */
  private static encodedAccountValue(accountProof: string): string {
    const decodedProof = RLP.decode(accountProof);
    const leafElement = decodedProof[decodedProof.length - 1];
    return `0x${leafElement[leafElement.length - 1].toString('hex')}`;
  }
}

/** Generated proof data interface. */
export interface ProofData {
  address: string;
  accountProof: string[];
  balance: string;
  codeHash: string;
  nonce: string;
  storageHash: string;
  storageProof: StorageProof[];
  serializedAccountProof?: string;
  encodedAccountValue?: string;
  block_number?: string;
}

/** Storage proof data interface. */
export interface StorageProof {
  key: string;
  value: string;
  proof: string[];
  serializedProof: string;
}

export default ProofGenerator;
