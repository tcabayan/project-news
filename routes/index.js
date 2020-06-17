var express = require("express");
var router = express.Router();

var axios = require("axios");
var cheerio = require("cheerio");

var db = require("../models");

// NPR scrape route
router.get("/scrape", (req, res) => {
    axios.get("https://www.npr.org/sections/news/")
    .then(function(response) {
        const $ = cheerio.load(response.data);
            $("article h2").each(function(i, element) {
                const result = {};
                result.title = $(this)
                    .children('a')
                    .text();
                result.link = $(this)
                    .children('a')
                    .attr('href')
                result.summary = $(this)
                    .children('a')
                    .text();
            db.Article.create(result)
            .then(dbArticle => {console.log(dbArticle);
            }).catch(error => {return res.json(error);
            });
        });
        res.send('scrape complete. redirecting.')
    });
});

// Articles from the db to handlebars.
router.get("/", (req, res) => {
    db.Article.find({}).limit(15)
    .then((articles) => {
    res.render('index', {articles})
    })
    .catch((err) => {
        res.json(err);
    });
});


router.get("/articles", (req, res) => {
    db.Article.find({})
    .then((dbArticle) => {
        res.json(dbArticle);
    })
    .catch((err) => {
        res.json(err);
    });
});

// find article by id, populate it with it's note
router.get("/articles/:id", (req, res) => {
    db.Article.findById({ _id: req.params.id })
    .populate("note")
    .then((dbArticle) => {
        res.json(dbArticle);
            //console.log('this note is attached ' + dbArticle)
    })
    .catch((err) => {
        res.json(err);
    });
});

// set article to saved
router.put("/saved/:id", (req, res) => {
    db.Article.update(
        {_id: req.params.id},
        {saved: true}
    )
    .then((result) => {
        res.json(result);
    })
    .catch((error) => {
        res.json(error);
    });
});

// view saved articles
router.get('/saved', (req, res) => {
    db.Article.find({ "saved" : true})
    .then((articles => res.render('saved', {articles})))
})

// drop the Articles collection.
router.get("/delete-articles", (req, res, next) => {
    db.Article.deleteMany({}, (err) => {
        if (err) {
            console.log(err)
        } else {
            console.log("articles dropped!");
        }
    })
    .then((dropnotes) => {
        db.Note.deleteMany({}, (err) => {
            if (err) {
                console.log(err)
            } else {
                console.log("notes dropped!");
            }
        })
    })
    res.render('index');
});

// post notes
router.post("/articles/:id", (req, res) => {
    const noteBody = req.body;
    const article = req.params.id;  
    db.Note.create(noteBody).then((response) => {
      db.Article.findByIdAndUpdate(article, { $set: { note: response } }, function (err, done) {
      });
    }).then(noteArticle => res.json(noteArticle)).catch(err => console.log(err))
  });

// AS OF TIME OF SUBMISSION, DELETE NOTE IS STILL NOT FUNCTIONING. I HAVE 10 HOURS TO FIGURE IT OUT. THE FOLLOWING CODE IS MY ATTEMPT AT IT, I WILL DELETE THIS NOTE WHEN IT IS COMPLETED.

// delete single note
router.delete("/deletenote/:id", function (req, res) {
    console.log('note id ' + req.params.id);
    db.Note.deleteOne({ _id: req.params.id })
      .then(function (dbNote) {
        db.Article.update(
          { note: { $in: [req.params.id] } },
          { $pull: { note: [req.params.id] } }
        )
      });
  });



module.exports = router;