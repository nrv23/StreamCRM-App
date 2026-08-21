Si da errir por usar un usuario constume 

# 1. Entrar al cliente de Redis
redis-cli

# 2. Autenticarte si Redis ya tenía contraseña previa (con el usuario default/root)
> AUTH 12345

# 3. Crear el usuario 'streamcrm' con estado ON, contraseña '12345', acceso a todas las llaves (~*) y todos los comandos (+@all)
> ACL SETUSER streamcrm on >12345 ~* +@all

# 4. Guardar los cambios permanentemente en el archivo redis.conf
> SAVE

Luego en el archivo redis/redis.config se configura el usuario 

user default off
user streamcrm on >12345 ~* &stream-crm:* +@all

CTRL + x
CTRL + o

recrear el container

Luego

nvm23@nvm23-HP-Laptop-15-da2xxx:~/Escritorio/Stream-CRM/apps/notification-service$ docker exec -it redis-server redis-cli \
  --user streamcrm \
  -a 12345 \
  ACL GETUSER streamcrm

  debe tener una respuesta como esta
Warning: Using a password with '-a' or '-u' option on the command line interface may not be safe.
 1) "flags"
 2) 1) "on"
    2) "sanitize-payload"
 3) "passwords"
 4) 1) "5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5"
 5) "commands"
 6) "+@all"
 7) "keys"
 8) "~*"
 9) "channels"
10) "&stream-crm:*"
11) "selectors"
12) (empty array)

What's next:
    Try Docker Debug for seamless, persistent debugging tools in any container or image → docker debug redis-server
    Learn more at https://docs.docker.com/go/debug-cli/
