const path = require('path');
const fs = require('fs');

const express = require('express')
const router = express.Router()

console.log(__dirname);

// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
  console.log('Time: ', Date.now())
  console.log('IP: ', req.headers['x-forwarded-for'] || req.connection.remoteAddress);
  next()
})

router.get('/articles', function (req, res) {
    res.render(path.join(__dirname+'/../views/articles.ejs'));
})

router.get('/article_overview', function (req, res) {
    res.render(path.join(__dirname+'/../views/article_overview.ejs'));
})

router.get('/dept_info', function (req, res) {
    res.render(path.join(__dirname+'/../views/dept_info.ejs'));
})

router.get(['/', '/index'], function (req, res) {
    res.render(path.join(__dirname+'/../views/index.ejs'));
})

router.get('/members', function (req, res) {
    res.render(path.join(__dirname+'/../views/members.ejs'));
})

module.exports = router
