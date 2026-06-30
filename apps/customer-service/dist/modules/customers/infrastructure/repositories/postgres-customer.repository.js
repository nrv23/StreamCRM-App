export class PostgresCustomerRepository {
    async save(customer) {
        // Aquí va el INSERT con pg.
        console.log("Saving customer in PostgreSQL", customer);
    }
    async findById(id) {
        // Aquí va el SELECT por id.
        console.log("Finding customer by id", id);
        return null;
    }
    async findByEmail(email) {
        // Aquí va el SELECT por email.
        console.log("Finding customer by email", email);
        return null;
    }
}
