const { Pool } = require('pg');

const stores = require('./stores.json');

class ModelClass {
    constructor() {
        this.connection = new Pool({
            user: 'postgres',
            host: process.env.POSTGRES_HOST || 'localhost',
            database: 'postgres',
            password: '12345',
            port: 5432,
        });
    }

    async connectDatabase() {
        await this.connection.connect();
    }

    async setupDatabase() {
        await this.connection.query(`
    CREATE TABLE IF NOT EXISTS public.stores
    (
        id SERIAL,
        name text,
        url text,
        district text,
        rating integer,
        CONSTRAINT stores_pkey PRIMARY KEY (id)
    )`);

        await this.connection.query(`
      ALTER TABLE IF EXISTS public.stores
          OWNER to postgres
    `);


        for (const store of stores) {

            const { rows } = await this.connection.query(`
        SELECT * FROM stores WHERE name = $1
      `, [store.name]);

            if (rows.length === 0) {
                console.log(`Inserting ${store.name}`);
                await this.connection.query(`
          INSERT INTO stores (name, url, district)
          VALUES ($1, $2, $3)
        `, [store.name, store.url, store.district]);
            }
        }
    }

    async getStores() {
        const { rows } = await this.connection.query(`
      SELECT * FROM stores
    `);
        return rows;
    }


}


//     async checkForStore(storeName) {
//         const res = await this.client.query(`
//         SELECT * FROM public.stores WHERE name = $1 LIMIT 1
//         `, storeName)

//         return checkForStore.rows.length !== 0
//     }

//     async setup(storeJSON) {

//         await this.client.query(`
//         CREATE TABLE IF NOT EXISTS public.stores (
//             id SERIAL PRIMARY KEY,
//             name TEXT,
//             url TEXT,
//             district TEXT,
//             CONSTRAINT stores_pkey PRIMARY KEY (id)
//         );

//         ALTER TABLE IF EXISTS public.stores OWNER to postgres;
//         `)

//         for (const store of storeJSON) {
//             if (await this.checkForStore(store.name) === false) {
//                 await this.client.query(`
//                 INSERT INTO punlic.stores (name, url, district)
//                 VALUES ($1, $2, $3)
//                 `, [store.name, store.url, store.district])
//             }
//         }
//     }

//     async getAllStores() {
//         const res = await this.client.query('SELECT * FROM public.stores');
//         return res.rows
//     }

//     async updateStore(storeId, url, district) {
//         await this.client.query(`
//         UPDATE public.stores
//         SET url = $1, district = $2
//         WHERE id = $3
//         `, [url, district, storeId])
//     }

//     async deleteStore(storeId) {
//         await this.client.query(`
//         DELETE FROM public.stores
//         WHERE id = $1
//         `, [storeId])
//     }

//     async addNewStore(body) {
//         const { name, url, district } = body;

//         if (await this.checkForStore(name) === false) {
//             await this.client.query(`
//             INSERT INTO public.stores (name, url, district)
//             VALUES ($1, $2, $3)
//             `, [name, url, district])
//         }
//     }
// }

module.exports = ModelClass