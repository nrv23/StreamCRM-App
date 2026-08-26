import {
    pbkdf2,
    randomBytes,
    timingSafeEqual,
} from 'node:crypto';

import { promisify } from 'node:util';

const pbkdf2Async = promisify(pbkdf2);

export interface PasswordHasher {
    hash(password: string): Promise<string>;

    verify(
        password: string,
        storedHash: string,
    ): Promise<boolean>;
}

export class Pbkdf2PasswordHasher implements PasswordHasher {
    private readonly algorithm = 'pbkdf2';
    private readonly digest = 'sha512';
    private readonly iterations = 600_000;
    private readonly keyLength = 64;
    private readonly saltLength = 32;
    private readonly splitSeparator: string = '$'
    async hash(password: string): Promise<string> {
        const salt = randomBytes(this.saltLength).toString('hex');

        const derivedKey = await pbkdf2Async(
            password,
            salt,
            this.iterations,
            this.keyLength,
            this.digest,
        );

        const hash = derivedKey.toString('hex');

        return [
            this.algorithm,
            this.digest,
            this.iterations,
            salt,
            hash,
        ].join(this.splitSeparator);
    }

    async verify(
        password: string,
        storedHash: string,
    ): Promise<boolean> {
        try {
            const [
                algorithm,
                digest,
                iterations,
                salt,
                hash,
            ] = storedHash.split(this.splitSeparator);

            if (algorithm !== this.algorithm) {
                return false;
            }

            if (!digest || !iterations || !salt || !hash) {
                return false;
            }

            const storedBuffer = Buffer.from(hash, 'hex');

            const derivedKey = await pbkdf2Async(
                password,
                salt,
                Number(iterations),
                storedBuffer.length,
                digest,
            );

            if (derivedKey.length !== storedBuffer.length) {
                return false;
            }

            return timingSafeEqual(
                derivedKey,
                storedBuffer,
            );
        } catch {
            return false;
        }
    }
}