require('dotenv').config()
const express = require('express');
const app = express();
const port = 3000;

const ModelClass = require('./model.js');
const Model = new ModelClass();

app.get('/', async (req, res) => {
    const stores = await Model.getStores();
    res.json(stores);
});

const server = async () => {
    await Model.connectDatabase();
    await Model.setupDatabase();

    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
    });
};


// app.get('/setup', async (req, res) => {
//     await Model.setup(storeJSON);
//     res.send("Setup complete!")
// })

// app.post('/', express.json, async (req, res) => {
//     const { body } = req;
//     await Model.addNewStore(body);
//     res.send("Store added!")
// })

// app.post('/', express.json, async (req, res) => {
//     const { storeId } = req.query;
//     const { url, district } = req.body;
//     await Model.updateStore(storeId, url, district);
// })

// app.post('/', express.json, async (req, res) => {
//     const { storeId } = req.query;
//     await Model.deleteStore(storeId);
// })

// POSTGRES CONNECTION  ===================================

server();