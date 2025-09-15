export abstract class BlockchainSynchronizeService {
    public abstract synchronize(): Promise<void>;
}
