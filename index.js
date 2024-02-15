require('dotenv').config()
const express = require('express');
const expressHandlebars = require('express-handlebars')
const expressSession = require('express-session')
const app = express();
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser')
const path = require('path')
const port = 3000;

const ModelClass = require('./model.js');
const Model = new ModelClass();

// HARD CODED USERS
const users = [
    {
        username: "admin",
        password: "password",
        isAdmin: true
    },
    {
        username: "user",
        password: "password",
        isAdmin: false
    }

]

app.use(
    expressSession({
        saveUninitialized: false,
        resave: false,
        secret: 'my-secret-token',
    })
)


// crypto.createHash('sha256').update("password").digest("hex")

app.use(cookieParser());

app.use(function (req, res, next) {
    const isLoggedIn = req.session.isLoggedIn
    res.locals.isLoggedIn = isLoggedIn
    next()
})

app.engine('hbs', expressHandlebars.engine({
    defaultLayout: 'main.hbs',
}))

app.use(
    express.static("static")
)

app.use(
    bodyParser.urlencoded({
        extended: false
    })
)




app.get('/', async (req, res) => {
    const stores = await Model.getStores();
    res.render('start.hbs')
    // res.json(stores);
});


app.get('/stores', async (req, res) => {
    const storesJSON = await Model.getStores();
    const stores = []

    for (let i in storesJSON) {
        stores.push({
            id: storesJSON[i].id,
            name: storesJSON[i].name,
            url: storesJSON[i].url,
            district: storesJSON[i].district,
        })
    }

    const model = {
        stores
    }

    res.render('stores.hbs', model)

});

app.get('/stores/:id', async (req, res) => {
    const storeId = req.params.id;
    const store = await Model.getStoreById(storeId);

    const model = {
        store,
    }

    res.render('store.hbs', model);
});

app.post('/stores/:id/delete', function (req, res) {
    if (req.session.isLoggedIn && req.session.username === "admin") {
        const storeId = req.params.id;
        Model.deleteStore(storeId);

        res.redirect('/stores');
    } else {
        res.status(403).send('Unauthorized');
    }
});


app.get('/log-in', async (req, res) => {
    res.render('log-in.hbs')
})

app.post('/log-in', function (req, res) {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (user && user.isAdmin) {
        req.session.isLoggedIn = true
        req.session.username = username
        res.redirect('/account');
    }
    else if (user && !user.isAdmin) {
        req.session.isLoggedIn = true
        req.session.username = username
        res.redirect('/account');
    }
    else {
        const model = {
            failedToLogIn: true,
            username,
            password
        }

        res.status(401).render('log-in.hbs', model);
    }
});

app.get("/log-out", function (req, res) {
    req.session.isLoggedIn = false

    res.redirect("/")
})

app.get('/account', function (req, res) {
    if (req.session.isLoggedIn && req.session.username === "admin") {

        const model = {
            username: req.session.username,
        }

        res.render('account.hbs', model)
    } else {
        res.status(401).send("You are not authorized to access this page!")
    }
})

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