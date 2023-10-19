import { Proof, Trie } from '@ethereumjs/trie';
import { Receipt } from './types.js';
import { TxReceipt, encodeReceipt } from '@ethereumjs/vm';
import { RLP } from '@ethereumjs/rlp';

export class TrieWrapper {
  static encodeKey(key: number) {
    return RLP.encode(key);
  }

  static async trieFromReceipts(receipts: Receipt[]): Promise<Trie> {
    const trie = new Trie();
    for (const [i, receipt] of receipts.entries()) {
      await trie.put(this.encodeKey(i), encodeReceipt(receipt as unknown as TxReceipt, receipt.type))
    }
    return trie;
  }

  static trieFromTransactions(receipts: any[]): Trie {
    throw new Error('not implemented');
  }

  static async createProof(trie: Trie, key: number): Promise<Proof> {
    return trie.createProof(this.encodeKey(key));
  } 
}