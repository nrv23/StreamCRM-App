import {
    createHmac,
    timingSafeEqual,
} from 'node:crypto';
import { ISecretHasher } from '../../interfaces/user/auhtcode-hash.interface.ts';


export class HmacSecretHasher implements ISecretHasher {
    private readonly algorithm = 'sha256';

    constructor(
        private readonly secret: string,
    ) { }

    async hash(value: string): Promise<string> {
        return createHmac(
            this.algorithm,
            this.secret,
        )
            .update(value)
            .digest('hex');
    }

    async verify(
        value: string,
        storedHash: string,
    ): Promise<boolean> {
        try {
            const calculatedHash = await this.hash(value);

            const calculatedBuffer = Buffer.from(
                calculatedHash,
                'hex',
            );

            const storedBuffer = Buffer.from(
                storedHash,
                'hex',
            );

            if (
                calculatedBuffer.length !==
                storedBuffer.length
            ) {
                return false;
            }

            return timingSafeEqual(
                calculatedBuffer,
                storedBuffer,
            );
        } catch {
            return false;
        }
    }
}