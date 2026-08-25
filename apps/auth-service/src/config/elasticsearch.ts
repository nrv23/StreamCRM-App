import { Client } from '@elastic/elasticsearch';
import { Logger } from 'winston';
import { ClusterHealthHealthResponseBody } from '@elastic/elasticsearch/lib/api/types'
//'@elastic/elasticsearch/lib/api/typesWithBodyKey';

import { env } from './enviroment.ts';
import { WinstonLogger } from '../shared/utils/winstonLogger.ts';


const log: Logger = WinstonLogger.getInstance(
    env.elastic_search_url,
    'authElasticSearchServer',
    'debug',
    env.index_elastic_search_name
);

export const elasticSearchClient = new Client({
    node: env.elastic_search_url
});

async function createLogIndex(): Promise<void> {

    const exists = await elasticSearchClient.indices.exists({
        index: env.index_elastic_search_name
    });

    if (exists) {
        log.info(`Elasticsearch index [${env.index_elastic_search_name}] already exists`);
        return;
    }

    await elasticSearchClient.indices.create({
        index: env.index_elastic_search_name,
        mappings: {
            properties: {
                '@timestamp': {
                    type: 'date'
                },
                level: {
                    type: 'keyword'
                },
                service: {
                    type: 'keyword'
                },
                event: {
                    type: 'keyword'
                },
                event_id: {
                    type: 'keyword'
                },
                message: {
                    type: 'text'
                }
            }
        }
    });

    log.info(`Elasticsearch index [${env.index_elastic_search_name}] created`);
}

export async function connect(): Promise<void> {

    let isConnected = false;

    while (!isConnected) {

        log.info('AuthService connecting to Elasticsearch...');

        try {

            const healthResponse: ClusterHealthHealthResponseBody =
                await elasticSearchClient.cluster.health({});

            log.info(
                `AuthService Elasticsearch health status - ${healthResponse.status}`
            );

            await createLogIndex();

            isConnected = true;

        } catch (error) {

            log.error('Connection to Elasticsearch failed. Retrying...', {
                error
            });
        }
    }
}