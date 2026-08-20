Si da errir por usar un usuario constume 

# 1. Entrar al cliente de Redis
redis-cli

# 2. Autenticarte si Redis ya tenía contraseña previa (con el usuario default/root)
> AUTH 12345

# 3. Crear el usuario 'streamcrm' con estado ON, contraseña '12345', acceso a todas las llaves (~*) y todos los comandos (+@all)
> ACL SETUSER streamcrm on >12345 ~* +@all

# 4. Guardar los cambios permanentemente en el archivo redis.conf
> SAVE