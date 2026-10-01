import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';
import dns from 'node:dns';

import { env } from './enviroment.ts';

dns.setDefaultResultOrder('ipv4first');

const transportOptions: SMTPTransport.Options = {
    host: env.nodemailer.host,
    port: env.nodemailer.port,
    secure: env.nodemailer.secure,

    requireTLS: true,

    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    auth: {
        type: 'OAuth2',
        user: env.nodemailer.auth.user,
        clientId: env.nodemailer.auth.client_id,
        clientSecret: env.nodemailer.auth.client_secret,
        refreshToken: env.nodemailer.auth.refresh_token,
    },
};

export const transporter = nodemailer.createTransport(transportOptions);

export const verifyTransporterConnection =
    async (): Promise<boolean> => {
        try {
            await transporter.verify();

            console.log(
                '[Nodemailer] Transporter connection successfully verified'
            );

            return true;
        } catch (error) {
            console.error(
                '[Nodemailer] Failed to verify transporter connection:',
                error
            );

            return false;
        }
    };