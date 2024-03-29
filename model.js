const { Pool } = require('pg');

const stores = require('./stores.json');
const { log } = require('handlebars');

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
      SELECT * FROM stores ORDER BY name ASC
    `);
        return rows;
    }

    async getStoresDescOrdered() {
        const { rows } = await this.connection.query(`
      SELECT * FROM public.stores ORDER BY name DESC
    `);
        return rows;
    }

    async getStoreById(storeId) {
        const { rows } = await this.connection.query(`
            SELECT * FROM stores WHERE id = $1
        `, [storeId]);
        return rows[0];
    }

    async checkForStore(storeName) {
        const res = await this.connection.query(`
                SELECT * FROM public.stores WHERE name = $1 LIMIT 1
                `, storeName)

        return checkForStore.rows.length !== 0
    }

    async addNewStore(body) {
        const { name, url, district } = body;
        const text = 'INSERT INTO public.stores(name, url, district) VALUES($1, $2, $3) RETURNING *'
        const values = [name, url, district]

        try {
            const { rows } = await this.connection.query(text, values)
            return rows[0].id
        } catch (e) {
            console.error(e)
            setImmediate(() => { throw e })
        }
    }

    async deleteStore(storeId) {
        await this.connection.query(`
        DELETE FROM public.stores
        WHERE id = $1
        `, [storeId])
    }

    async updateStore(newName, newURL, newDistrict, storeId) {
        await this.connection.query(`
        UPDATE public.stores
        SET name = $1, url = $2, district = $3
        WHERE id = $4
        `, [newName, newURL, newDistrict, storeId])
    }
}

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