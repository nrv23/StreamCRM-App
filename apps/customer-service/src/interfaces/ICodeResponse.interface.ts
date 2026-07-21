// 1. Definimos el enum con los códigos

import { ApiErrorCode } from "../enum/error-codes.enum.js";




// 2. La interfaz usa el enum para el tipo de 'code'
interface CodeResponse {
    code: ApiErrorCode;
    message: string;
}

// 3. El diccionario permite strings O los valores del enum como clave
export interface CodeResponseDictionary { // estructura de tipo dictionary
    [key: string]: CodeResponse;
}

