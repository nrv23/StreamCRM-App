import { Client } from '@elastic/elasticsearch';
import { Logger } from 'winston';
import { ClusterHealthHealthResponseBody } from '@elastic/elasticsearch/lib/api/types'
//'@elastic/elasticsearch/lib/api/typesWithBodyKey';
import { winstonLogger } from '../shared/utils/winstonLogger.ts';
import { env } from './enviroment.ts';

export const INDEX_NAME = 'app-logs-customer-service';

const log: Logger = winstonLogger(
    env.elastic_search_url,
    'customerElasticSearchServer',
    'debug',
    INDEX_NAME
);

export const elasticSearchClient = new Client({
    node: env.elastic_search_url
});

async function createLogIndex(): Promise<void> {

    const exists = await elasticSearchClient.indices.exists({
        index: INDEX_NAME
    });

    if (exists) {
        log.info(`Elasticsearch index [${INDEX_NAME}] already exists`);
        return;
    }

    await elasticSearchClient.indices.create({
        index: INDEX_NAME,
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

    log.info(`Elasticsearch index [${INDEX_NAME}] created`);
}

export async function connect(): Promise<void> {

    let isConnected = false;

    while (!isConnected) {

        log.info('CustomerService connecting to Elasticsearch...');

        try {

            const healthResponse: ClusterHealthHealthResponseBody =
                await elasticSearchClient.cluster.health({});

            log.info(
                `CustomerService Elasticsearch health status - ${healthResponse.status}`
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