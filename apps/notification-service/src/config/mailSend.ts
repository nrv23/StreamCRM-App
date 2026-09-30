// esto es resend cambiar luego el nombre de varuabkes y archivos
import { Resend } from 'resend';
import { env } from './enviroment.ts';
// quitar e
//export const resend = new Resend(env.mailsend.api_key);


export const resend = new Resend(env.mailsend.api_key);