
export interface IRedisMessagePublisher<T = unknown> {
    message: T
}

export interface IRedisPublisher {
    publish<T>(
        channel: string,
        data: T
    ): Promise<void>
}