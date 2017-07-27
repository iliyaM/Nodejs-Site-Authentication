const express = require('express');
const router = express.Router();

//Catch root get and render index.handlebars
router.get('/', (req, res) => {
    res.render('index');
});

module.exports = router;