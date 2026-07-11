import { AuthenticatedUser } from "../../interfaces/authentication-user.interface.ts";


declare global {
    namespace Express { // extender el objeto request de express y agregarle un campo llamada user
        interface Request {
            user: AuthenticatedUser;
        }
    }
}

export { }; // se debe exportar asi para que el compilador de ts lo interprete como un modulo