/**
 * Transformed transaction
 */
export type TransformedTransaction = {
  hash: string;
  timestamp: number;
  blockNumber: number;
  from: string;
  subject: string;
  isBuy: boolean;
  amount: number;
  cost: number;
};
