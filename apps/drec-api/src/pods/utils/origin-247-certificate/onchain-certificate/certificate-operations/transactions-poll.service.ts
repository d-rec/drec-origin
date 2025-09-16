import { Injectable } from '@nestjs/common';

const pollDelay = 3000;
const maxRetries = 100;

type TxHash = string;
type BlockchainCertificateId = number;

@Injectable()
export class TransactionPollService<T = null> {
    /**
     * @NOTE
     *
     * If:
     * 1. replaced by a persistent storage (redis)
     * then on application startup we could see if we still await some transactions.
     *
     * This may not be possible at this point, since if application fails (so the startup happens),
     * then the job will not be awaited on the client side, so the result would not matter anyway.
     */
    private processedTransactions: Record<TxHash, true> = {};

    private newCertificates: Record<TxHash, BlockchainCertificateId[]> = {};

    public async waitForNewCertificates(txHash: string): Promise<number[]> {
        return await this.poll(txHash, async (hash) => {
            const certificateIds = this.newCertificates[hash];

            if (!certificateIds) {
                return new Error('Transaction not on blockchain');
            }

            if (certificateIds.length === 0) {
                return new Error('Could not find certificate');
            }

            return certificateIds;
        });
    }

    public async waitForTransaction(txHash: string): Promise<void> {
        await this.poll(txHash, async (hash) => {
            const isPresent = hash in this.processedTransactions;

            if (isPresent) {
                delete this.processedTransactions[hash];
            } else {
                return new Error('Transaction was not registered');
            }
        });
    }

    public saveTransactionAsProcessed(txHash: string): void {
        this.processedTransactions[txHash] = true;
    }

    public saveNewCertificate(txHash: string, blockchainCertificateIds: number[]): void {
        this.newCertificates[txHash] = blockchainCertificateIds;
    }

    private async poll<T>(
        txHash: string,
        cb: (txHash: string) => Promise<T | Error>,
        tryCount = 0
    ): Promise<T> {
        const result = await cb(txHash);

        if (result instanceof Error) {
            if (tryCount === maxRetries) {
                throw new Error(
                    `Unable to query for transaction ${txHash} for ${
                        maxRetries * pollDelay
                    }ms. Latest reason: ${result.message}`
                );
            }

            await new Promise((resolve) => setTimeout(resolve, pollDelay));

            return this.poll(txHash, cb, tryCount + 1);
        }

        return result;
    }
}
