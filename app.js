// PACKAGE REQUIRES =======================================

const express = require('express')
const expressHandlebars = require('express-handlebars')
const sqlite3 = require('sqlite3')
const expressSession = require('express-session')
const bodyParser = require('body-parser')
const SQLiteStore = require('connect-sqlite3')(expressSession);
const bcrypt = require('bcrypt')

const data = require('./stores.json')


// HARDCODED USER CREDENTIALS =============================

const ADMIN_USERNAME = "bacco"
const ADMIN_PASSWORD = "$2b$10$FN0RON3sGt.Fol2p9eitRO25PmHqvaD7kQA5wF9IByuRCijlvVSGa"

const USER_USERNAME = "micahmaa"
const USER_PASSWORD = "$2b$10$WanKs7x7o9jPRouU.rqnn..RMHAzYJLS.nedc1al5iMD7chbzH1cm"


// ERROR HANDLING VARIABLES ===============================

// note related variables
const MAX_NOTE_TITLE_LENGTH = 60
const MAX_NOTE_DESC_LENGTH = 120

// collection related variables
const MAX_COLLECTION_TITLE_LENGTH = 60
const MAX_COLLECTION_DESC_LENGTH = 120

// comments related variables
const MAX_COMMENT_TITLE_LENGTH = 60
const MAX_COMMENT_CONTENT_LENGTH = 120


// DATABASE ===============================================

const db = new sqlite3.Database("jkpg_stores-database.db")

// db.run(`
// 	CREATE TABLE IF NOT EXISTS collections (
// 		collectionId INTEGER,
// 		collectionTitle TEXT,
// 		collectionAuthor TEXT,
// 		collectionDesc TEXT,
// 		PRIMARY KEY(collectionId AUTOINCREMENT)
// 	)
// `)

// db.run(`
// 	CREATE TABLE IF NOT EXISTS comments (
// 		commentId	INTEGER,
// 		commentTitle TEXT,
// 		commentContent	TEXT,
// 		commentAuthor	TEXT,
// 		noteId	INTEGER,
// 		FOREIGN KEY(noteId) REFERENCES notes(noteId),
// 		PRIMARY KEY(commentId AUTOINCREMENT)
// 	)
// `)

// db.run(`
// CREATE TABLE IF NOT EXISTS notes (
// 	noteId	INTEGER,
// 	noteTitle	TEXT,
// 	noteImage	TEXT,
// 	noteAuthor	TEXT,
// 	noteDesc	TEXT,
// 	collectionId	INTEGER,
// 	FOREIGN KEY(collectionId) REFERENCES collections(collectionId),
// 	PRIMARY KEY(noteId AUTOINCREMENT)
// )
// `)

db.run(`
CREATE TABLE IF NOT EXISTS stores (
	storeId	INTEGER,
	storeName	TEXT,
	storeURL	TEXT,
	storeDistrict	TEXT,
	PRIMARY KEY(storeId AUTOINCREMENT)
)
`)


// EXPRESS INITIALISATION =================================

const app = express()

app.engine('hbs', expressHandlebars.engine({
	defaultLayout: 'main.hbs',
}))

app.use(
	express.static("node_modules/spectre.css/dist"),
	express.static("static")
)

app.use(
	expressSession({
		saveUninitialized: false,
		resave: false,
		secret: 'asd',
		store: new SQLiteStore()
	})
)

app.use(
	bodyParser.urlencoded({
		extended: false
	})
)

app.use(function (request, response, next) {
	const isLoggedIn = request.session.isLoggedIn
	response.locals.isLoggedIn = isLoggedIn
	next()
})


// ERROR HANDLING FUNCTIONS ===============================

function getValidationErrorsForStores(storeName, storeURL, storeDistrict) {
	const validationErrors = []

	if (storeName.length == 0) {
		validationErrors.push("Title cannot be empty")
	}

	if (storeName.length > MAX_NOTE_TITLE_LENGTH) {
		validationErrors.push("The title cannot be longer than" + MAX_NOTE_TITLE_LENGTH + "characters.")
	}

	if (storeURL > MAX_NOTE_DESC_LENGTH) {
		validationErrors.push("The description cannot be longer than" + MAX_NOTE_DESC_LENGTH + "characters.")
	}

	if (storeURL.length == 0) {
		validationErrors.push("The image URL cannot be empty")
	}

	if (storeDistrict == undefined) {
		validationErrors.push('Please choose a District from the list. If your district is not specified, please choose "Other".')
	}

	return validationErrors
}

function getValidationErrorsForCollections(collectionTitle, collectionDesc) {
	const validationErrors = []

	if (collectionTitle.length == 0) {
		validationErrors.push("Title cannot be empty")
	}

	if (collectionDesc > MAX_COLLECTION_TITLE_LENGTH) {
		validationErrors.push("The description cannot be longer than" + MAX_COLLECTION_TITLE_LENGTH + "characters.")
	}

	if (collectionDesc.length == 0) {
		validationErrors.push("Collection description cannot be empty.")
	}

	if (collectionDesc > MAX_COLLECTION_DESC_LENGTH) {
		validationErrors.push("The description cannot be longer than" + MAX_COLLECTION_DESC_LENGTH + "characters.")
	}

	return validationErrors
}

function getValidationErrorsForComments(commentTitle, commentContent) {
	const validationErrors = []

	if (commentTitle.length == 0) {
		validationErrors.push("The title of your comment cannot be empty.")
	}

	if (commentTitle.length > MAX_COMMENT_TITLE_LENGTH) {
		validationErrors.push("The title of your comment must be less than " + MAX_COMMENT_TITLE_LENGTH + " characters long.")
	}

	if (commentContent.length == 0) {
		validationErrors.push("The body of your comment cannot be empty.")
	}

	if (commentContent.length > MAX_COMMENT_CONTENT_LENGTH) {
		validationErrors.push("The body of your comment must be less than" + MAX_COMMENT_CONTENT_LENGTH + " characters long.")
	}

	return validationErrors
}


// HOMEPAGE ===============================================

app.get('/', function (request, response) {
	response.render('start.hbs')
})


// ABOUT PAGE =============================================
app.get('/about', function (request, response) {
	response.render('about.hbs')
})


// ABOUT PAGE =============================================
app.get('/contact', function (request, response) {
	response.render('contact.hbs')
})


// ========================================================
// NOTES RELATED FUNCTIONS ================================
// ========================================================

// all notes page
app.get('/stores', function (request, response) {
	const query = "SELECT * FROM stores ORDER BY storeId"
	db.all(query, function (error, stores) {

		if (error) {
			console.log(error)
		}
		else {
			const model = {
				stores
			}

			response.render('stores.hbs', model)
		}
	})
})

// create a new note page
app.get('/stores/create-store', function (request, response) {
	response.render('create-store.hbs')
})

// create a new note post request
app.post("/stores/create-store", function (request, response) {
	const storeName = request.body.name
	const storeURL = request.body.url
	const storeDistrict = request.body.district

	const validationErrors = getValidationErrorsForStores(storeName, storeURL, storeDistrict)

	if (!request.session.isLoggedIn) {
		validationErrors.push("You have to be logged in to add a store.")
	}

	if (validationErrors.length == 0) {
		const query = "INSERT INTO stores (storeName, storeURL, storeDistrict) VALUES (?, ?, ?)"
		const values = [storeName, storeURL, storeDistrict]

		db.run(query, values, function (error) {
			if (error) {
				console.log(error)
			}
			else {
				response.redirect('/stores/' + this.lastID)
			}
		})
	}
	else {
		const model = {
			validationErrors,
			storeName,
			storeURL,
			storeDistrict,
			storeId: request.params.id
		}

		response.render('create-store.hbs', model)
	}
})


// delete a note
app.post("/note-delete/:id", function (request, response) {

	const loginError = []

	if (!request.session.isLoggedIn) {
		loginError.push("You have to be logged in to delete a note.")
	}

	if (request.session.username != ADMIN_USERNAME) {
		loginError.push("Only the admin can delete the note")
	}

	if (loginError == 0) {
		const query = "DELETE FROM notes WHERE noteId = ?"
		const value = request.params.id

		db.run(query, value, function (error) {
			if (error) {
				"Something went wrong, try again later"
			}
			else {
				response.redirect('/notes')
			}
		})
	}

	else {
		const model = {
			loginError
		}

		response.render('note.hbs', model)
	}
})


// update a note page
app.get("/note-update/:id", function (request, response) {
	const id = request.params.id

	const loginError = []

	if (!request.session.isLoggedIn) {
		loginError.push("You have to be logged in to update a note.")
	}

	if (request.session.username != ADMIN_USERNAME) {
		loginError.push("Only the admin can update the note")
	}

	if (loginError == 0) {
		const query = "SELECT noteId, noteTitle, noteImage, noteDesc FROM notes WHERE noteId = ?"
		const values = [id]

		db.get(query, values, function (error, note) {
			if (error) {
				console.log(error)
			}
			else {
				const model = {
					noteId: note.noteId,
					noteTitle: note.noteTitle,
					noteImage: note.noteImage,
					noteDesc: note.noteDesc
				}

				response.render("note-update.hbs", model)
			}
		})
	}

	else {
		const model = {
			loginError
		}
		response.render("note.hbs", model)
	}

})

// update a note post request
app.post("/note-update/:id", function (request, response) {

	const loginError = []

	if (!request.session.isLoggedIn) {
		loginError.push("You have to be logged in to update a note.")
	}

	if (request.session.username != ADMIN_USERNAME) {
		loginError.push("Only the admin can update the note")
	}

	const id = request.params.id
	const newNoteTitle = request.body.newNoteTitle
	const newNoteImage = request.body.newNoteImage
	const newNoteDesc = request.body.newNoteDesc

	const validationErrors = getValidationErrorsForStores(newStoreName, newStoreURL)

	if (validationErrors.length == 0) {
		const query = "UPDATE stores SET storeName = ?, storeURL = ?"
		const values = [newStoreName, newStoreURL, id]

		db.all(query, values, function (error) {
			if (error) {
				console.log(error)
			}
			else {
				response.redirect("/stores/" + id)
			}
		})
	}
	else {
		const model = {
			validationErrors,
			storeId: id,
			storeName: newStoreName,
			storeURL: newStoreURL,
		}

		response.render("store-update.hbs", model)
	}
})

// add note to a collection page
app.get('/add-to-collection/:id', function (request, response) {
	const id = request.params.id

	const query = "SELECT * FROM collections WHERE collectionAuthor = ?"
	const values = [request.session.username]

	const loginError = []

	if (!request.session.isLoggedIn) {
		loginError.push("You must be logged in to add a note to a collection")

		const model = {
			loginError
		}

		response.render("note.hbs", model)
	}
	else {
		db.all(query, values, function (error, collections) {
			if (error) {
				console.log(error);
				response.redirect("/error/")
			}

			else {
				const model = {
					collections
				}

				response.render("add-to-collection.hbs", model)
			}
		})
	}
})

// add note to a collection post request
app.post('/add-to-collection/:id', function (request, response) {
	const collectionId = request.body.selectedCollection
	const noteId = request.params.id

	const query = "UPDATE notes SET collectionId = ? WHERE noteId = ?"
	const values = [collectionId, noteId]

	db.run(query, values, function (error) {
		if (error) {
			console.log(error);
			response.redirect("/error/")
		}
		else {
			response.redirect("../collections/" + collectionId)
		}
	})
})

// detailed view of a note
app.get("/stores/:id", function (request, response) {

	const id = request.params.id

	const query = `SELECT * FROM stores WHERE storeId = ?`
	const values = [id]

	db.get(query, values, function (error, store) {

		const model = {
			store,
		}

		response.render('store.hbs', model)

	})

})


// ========================================================
// COLLECTIONS ============================================
// ========================================================

// create a collection page
app.get('/collections/create-collection', function (request, response) {
	response.render('create-collection.hbs')
})

// create a collection post request
app.post("/collections/create-collection", function (request, response) {
	const collectionTitle = request.body.collectionTitle
	const collectionAuthor = request.session.username
	const collectionDesc = request.body.collectionDesc

	const validationErrors = getValidationErrorsForCollections(collectionTitle, collectionDesc)

	if (!request.session.isLoggedIn) {
		validationErrors.push(("You have to be logged in to create a collection."))
	}

	if (validationErrors.length == 0) {
		const query = "INSERT INTO collections (collectionTitle, collectionAuthor, collectionDesc) VALUES (?, ?, ?)"
		const values = [collectionTitle, collectionAuthor, collectionDesc]

		db.run(query, values, function (error) {
			if (error) {
				console.log(error)
			}
			else {
				response.redirect('/collections/' + this.lastID)
			}
		})
	}
	else {
		const model = {
			validationErrors,
			collectionTitle,
			collectionDesc,
			collectionId: request.params.id
		}

		response.render('create-collection.hbs', model)
	}
})

//detailed view of a collection
app.get('/collections/:id', function (request, response) {
	const id = request.params.id

	const query = "SELECT * FROM notes WHERE collectionId = ?"
	const values = [id]

	db.all(query, values, function (error, notes) {
		if (error) {
			console.log(error);
			response.redirect("/error/")
		}

		else {

			const query = "SELECT * FROM collections WHERE collectionId = ?"
			const values = [id]

			db.get(query, values, function (error, collection) {
				if (error) {
					console.log(error);
					response.redirect("/error/")
				}

				else {
					const collectionInfo = {
						collection
					}

					const model = {
						notes,
						collection: collectionInfo.collection
					}

					response.render("collection.hbs", model)
				}
			})
		}
	})
})

// all collections page
app.get('/collections', function (request, response) {
	const query = "SELECT * FROM collections ORDER BY collectionId"
	db.all(query, function (error, collections) {

		if (error) {
			console.log(error)
		}
		else {
			const model = {
				collections
			}

			response.render('collections.hbs', model)
		}
	})
})

// update a collection page
app.get("/collection-update/:id", function (request, response) {
	const id = request.params.id

	const loginError = []

	if (!request.session.isLoggedIn) {
		loginError.push("You have to be logged in to update a collection.")
	}

	if (request.session.username != ADMIN_USERNAME) {
		loginError.push("Only the admin can update the collection")
	}

	if (loginError == 0) {
		const query = "SELECT collectionId, collectionTitle, collectionDesc FROM collections WHERE collectionId = ?"
		const values = [id]

		db.get(query, values, function (error, collection) {
			if (error) {
				console.log(error)
			}
			else {
				const model = {
					collectionId: collection.collectionId,
					collectionTitle: collection.collectionTitle,
					collectionDesc: collection.collectionDesc,
				}

				response.render("collection-update.hbs", model)
			}
		})
	}

	else {
		const model = {
			loginError
		}
		response.render("collection.hbs", model)
	}

})

// update a collection post request
app.post("/collection-update/:id", function (request, response) {

	const loginError = []

	if (!request.session.isLoggedIn) {
		loginError.push("You have to be logged in to update a collection.")
	}

	if (request.session.username != ADMIN_USERNAME) {
		loginError.push("Only the admin can update the collection")
	}

	const id = request.params.id
	const newCollectionTitle = request.body.newCollectionTitle
	const newCollectionDesc = request.body.newCollectionDesc

	const validationErrors = getValidationErrorsForCollections(newCollectionTitle, newCollectionDesc)

	if (validationErrors.length == 0) {
		const query = "UPDATE collections SET collectionTitle = ?, collectionDesc = ? WHERE collectionId = ?"
		const values = [newCollectionTitle, newCollectionDesc, id]

		db.all(query, values, function (error) {
			if (error) {
				console.log(error)
			}
			else {
				response.redirect("/collections/" + id)
			}
		})
	}
	else {
		const model = {
			validationErrors,
			collectionId: id,
			collectionTitle: newCollectionTitle,
			collectionDesc: newCollectionDesc
		}

		response.render("collection-update.hbs", model)
	}
})

// delete a collection
app.post("/collection-delete/:id", function (request, response) {

	const loginError = []

	if (!request.session.isLoggedIn) {
		loginError.push("You have to be logged in to delete a collection.")
	}

	if (request.session.username != ADMIN_USERNAME) {
		loginError.push("Only the admin can delete the collection")
	}

	if (loginError == 0) {
		const query = "DELETE FROM collections WHERE collectionId = ?"
		const value = request.params.id

		db.run(query, value, function (error) {
			if (error) {
				console.log(error);
				response.redirect("/error/")
			}
			else {
				response.redirect('/collections')
			}
		})
	}

	else {
		const model = {
			loginError
		}

		response.render('collection.hbs', model)
	}
})


// ========================================================
// COMMENTS ===============================================
// ========================================================

// write a new comment page
app.get("/new-comment/:id", function (request, response) {
	const loginError = []

	if (!request.session.isLoggedIn) {
		loginError.push("You must be logged in to write a comment.")

		const model = {
			loginError
		}

		response.render("note.hbs", model)
	}
	else {
		response.render("write-comment.hbs")
	}
})

// write a new comment post request
app.post("/new-comment/:id", function (request, response) {
	const commentTitle = request.body.commentTitle
	const commentContent = request.body.commentContent
	const commentAuthor = request.session.username
	const noteId = request.params.id

	const validationErrors = getValidationErrorsForComments(commentTitle, commentContent)

	if (validationErrors.length == 0) {

		const query = "INSERT INTO comments (commentTitle, commentContent, commentAuthor, noteId) VALUES (?, ?, ?, ?)"
		const values = [commentTitle, commentContent, commentAuthor, noteId]

		db.run(query, values, function (error) {
			if (error) {
				console.log(error);
				response.redirect("/error/")
			}
			else {
				response.redirect("/notes/" + noteId)
			}
		})
	}
	else {
		const model = {
			validationErrors,
			commentTitle,
			commentContent
		}

		response.render("write-comment.hbs", model)
	}
})

// update a comment page
app.get("/comment-update/:id", function (request, response) {
	const id = request.params.id

	const loginError = []

	if (!request.session.isLoggedIn) {
		loginError.push("You have to be logged in to update a comment.")
	}

	if (request.session.username != ADMIN_USERNAME) {
		loginError.push("Only the admin can update the comment")
	}

	if (loginError == 0) {
		const query = "SELECT commentId, commentTitle, commentContent, noteId FROM comments WHERE commentId = ?"
		const values = [id]

		db.get(query, values, function (error, comment) {
			if (error) {
				console.log(error)
			}
			else {
				const model = {
					commentId: comment.commentId,
					commentTitle: comment.commentTitle,
					commentContent: comment.commentContent
				}

				response.render("comment-update.hbs", model)
			}
		})
	}

	else {
		const model = {
			loginError
		}
		response.render("collection.hbs", model)
	}

})

// update a comment post request
app.post("/comment-update/:id", function (request, response) {
	const loginError = []

	if (!request.session.isLoggedIn) {
		loginError.push("You have to be logged in to update a comment.")
	}

	if (request.session.username != ADMIN_USERNAME) {
		loginError.push("Only the admin can update the comment")
	}

	const id = request.params.id
	const newCommentTitle = request.body.newCommentTitle
	const newCommentContent = request.body.newCommentContent

	const validationErrors = getValidationErrorsForComments(newCommentTitle, newCommentContent)

	if (validationErrors.length == 0) {
		const query = "UPDATE comments SET commentTitle = ?, commentContent = ? WHERE commentId = ?"
		const values = [newCommentTitle, newCommentContent, id]

		db.all(query, values, function (error) {
			if (error) {
				console.log(error)
			}
			else {
				response.redirect("/notes/")
			}
		})
	}
	else {
		const model = {
			validationErrors,
			commentId: id,
			commentTitle: newCommentTitle,
			commentContent: newCommentContent
		}

		response.render("comment-update.hbs", model)
	}

})

// delete a comment
app.post("/comment-delete/:id", function (request, response) {

	const loginError = []

	if (!request.session.isLoggedIn) {
		loginError.push("You have to be logged in to delete a comment.")
	}

	if (request.session.username != ADMIN_USERNAME) {
		loginError.push("Only the admin can delete the comment")
	}

	if (loginError == 0) {
		const query = "DELETE FROM comments WHERE commentId = ?"
		const value = request.params.id

		db.run(query, value, function (error) {
			if (error) {
				console.log(error);
				response.redirect("/error/")
			}
			else {
				response.redirect('/notes')
			}
		})
	}

	else {
		const model = {
			loginError
		}

		response.render('notes.hbs', model)
	}
})



// ========================================================
// LOG-IN =================================================
// ========================================================

// log in page
app.get('/log-in', function (request, response) {
	response.render('log-in.hbs')
})

// log in post request
app.post("/log-in", function (request, response) {
	const enteredUsername = request.body.username
	const enteredPassword = request.body.password

	const adminPasswordCompare = bcrypt.compareSync(enteredPassword, ADMIN_PASSWORD);
	const userPasswordCompare = bcrypt.compareSync(enteredPassword, USER_PASSWORD);


	if (enteredUsername == ADMIN_USERNAME && adminPasswordCompare == true) {

		request.session.isLoggedIn = true
		request.session.username = enteredUsername

		response.redirect('/')
	}

	else if (enteredUsername == USER_USERNAME && userPasswordCompare == true) {
		request.session.isLoggedIn = true
		request.session.username = enteredUsername

		response.redirect('/')
	}

	else {
		const model = {
			failedToLogIn: true,
			enteredUsername,
			enteredPassword
		}

		response.render('log-in.hbs', model)
	}
})

// log out function
app.get("/log-out", function (request, response) {
	request.session.isLoggedIn = false

	response.redirect("/")
})

// profile page (fetch user-created notes and collections )
app.get('/profile', function (request, response) {
	const loginError = []

	if (!request.session.isLoggedIn) {
		loginError.push("You must be logged in first to access your profile.")

		const model = {
			loginError
		}

		response.render('profile.hbs', model)
	}

	if (loginError.length == 0) {

		const query = "SELECT * FROM notes WHERE noteAuthor = ?"
		const values = [request.session.username]

		db.all(query, values, function (error, notes) {
			if (error) {
				console.log(error)
			}

			else {

				const query = "SELECT * FROM collections WHERE collectionAuthor = ?"
				const values = request.session.username

				db.all(query, values, function (error, collections) {
					if (error) {
						console.log(error);
						response.redirect("/error/")
					}

					else {
						const retrievedCollections = {
							collections
						}

						const model = {
							username: request.session.username,
							notes,
							collections: retrievedCollections.collections
						}
						response.render('profile.hbs', model)
					}
				})

			}
		})
	}


})

// ========================================================
// SERVER ERROR ===========================================
// ========================================================

app.get("/error/", function (request, response) {
	response.render("error.hbs")
})

app.listen(8080)