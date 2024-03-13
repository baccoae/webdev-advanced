require('dotenv').config()
const express = require('express');
const expressHandlebars = require('express-handlebars')
const expressSession = require('express-session')
const app = express();
const Handlebars = require('handlebars')
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser')
const path = require('path')
const port = 3000;

const ModelClass = require('./model.js');
const { log } = require('console');
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

Handlebars.registerPartial('pageNotFound', '{{pageNotFound}}')

app.engine('hbs', expressHandlebars.engine({
    defaultLayout: 'main.hbs',
    partialsDir: 'views/partials',
}))


app.use(
    express.static("static")
)

app.use(
    bodyParser.urlencoded({
        extended: false
    })
)

function orderStoreByDistrict(district, store) {
    district.push({
        id: store.id,
        name: store.name,
        url: store.url,
        district: store.district,
    })
}




app.get('/', async (req, res) => {
    res.render('start.hbs')
});


app.get('/stores', async (req, res) => {
    const stores = await Model.getStores();
    const storesInAtollen = []
    const storesInResecentrum = []
    const storesInTandstick = []
    const storesInVaster = []
    const storesInOster = []
    const otherStores = []

    for (let i in stores) {
        switch (stores[i].district) {
            case "Atollen":
                orderStoreByDistrict(storesInAtollen, stores[i])
                break;
            case "Resecentrum":
                orderStoreByDistrict(storesInResecentrum, stores[i])
                break;
            case "Tändsticksområdet":
                orderStoreByDistrict(storesInTandstick, stores[i])
                break;
            case "Väster":
                orderStoreByDistrict(storesInVaster, stores[i])
                break;
            case "Öster":
                orderStoreByDistrict(storesInOster, stores[i])
                break;
            default:
                orderStoreByDistrict(otherStores, stores[i])
                break;
        }
    }

    const model = {
        // stores
        storesInAtollen,
        storesInResecentrum,
        storesInTandstick,
        storesInVaster,
        storesInOster,
        otherStores
    }

    res.render('stores.hbs', model)

});

app.get('/stores-order-desc', async (req, res) => {
    const stores = await Model.getStoresDescOrdered();
    const storesInAtollen = []
    const storesInResecentrum = []
    const storesInTandstick = []
    const storesInVaster = []
    const storesInOster = []
    const otherStores = []

    for (let i in stores) {
        switch (stores[i].district) {
            case "Atollen":
                orderStoreByDistrict(storesInAtollen, stores[i])
                break;
            case "Resecentrum":
                orderStoreByDistrict(storesInResecentrum, stores[i])
                break;
            case "Tändsticksområdet":
                orderStoreByDistrict(storesInTandstick, stores[i])
                break;
            case "Väster":
                orderStoreByDistrict(storesInVaster, stores[i])
                break;
            case "Öster":
                orderStoreByDistrict(storesInOster, stores[i])
                break;
            default:
                orderStoreByDistrict(otherStores, stores[i])
                break;
        }
    }

    const model = {
        storesInAtollen,
        storesInResecentrum,
        storesInTandstick,
        storesInVaster,
        storesInOster,
        otherStores
    }

    res.render('stores.hbs', model)
})

app.get('/stores/add', async (req, res) => {
    if (req.session.isLoggedIn && req.session.username === "admin") {
        res.render('add-store.hbs');
    } else {
        res.status(403).send('Unauthorized');
    }
})

app.post('/stores/add', async (req, res) => {
    if (req.session.isLoggedIn && req.session.username === "admin") {
        const newStore = await Model.addNewStore(req.body);
        res.redirect(`/stores/${newStore}`);
    }
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

app.get('/stores/:id/edit', async (req, res) => {
    if (req.session.isLoggedIn && req.session.username === "admin") {
        const storeId = req.params.id;
        const store = await Model.getStoreById(storeId);

        const model = {
            storeId: store.id,
            storeName: store.name,
            storeURL: store.url,
            storeDistrict: store.district
        }

        res.render('edit-store.hbs', model);
    } else {
        res.status(403).send('Unauthorized');
    }
})

app.post("/stores/:id/edit", async (req, res) => {

    if (req.session.isLoggedIn && req.session.username === "admin") {
        const storeId = req.params.id;
        const newName = req.body.newName;
        const newURL = req.body.newURL;
        const newDistrict = req.body.newDistrict;
        const store = await Model.updateStore(newName, newURL, newDistrict, storeId);

        // const model = {
        //     storeId: store.id,
        //     name: req.body.newName,
        //     url: req.body.newURL,
        //     district: req.body.newDistrict
        // }

        // res.render("/edit-store.hbs", model)
        res.redirect(`/stores/${storeId}`)
    }
})


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

// POSTGRES CONNECTION  ===================================

server();