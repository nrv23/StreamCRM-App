import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "./enviroment.ts";

export const transporter: Transporter = nodemailer.createTransport({
    host: env.nodemailer.host,
    port: env.nodemailer.port,
    secure: env.nodemailer.secure,
    auth: {
        user: env.nodemailer.auth.user,
        pass: env.nodemailer.auth.pass,
    },
});

export const verifyTransporterConnection = async (): Promise<boolean> => {
    try {
        await transporter.verify();
        console.log("[Nodemailer] Transporter connection successfully verified");
        return true;
    } catch (error) {
        console.error("[Nodemailer] Failed to verify transporter connection:", error);
        return false;
    }
};
