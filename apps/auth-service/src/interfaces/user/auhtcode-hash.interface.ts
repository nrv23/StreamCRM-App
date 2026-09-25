export interface ISecretHasher {
    hash(value: string): Promise<string>;

    verify(
        value: string,
        storedHash: string,
    ): Promise<boolean>;
}
