const express = require('express');
const router = express.Router();
const mailsController = require('../controllers/mailsController');

router.get('/free/:data', mailsController.giveAssisgnment);
router.get('/busy/:data', mailsController.dontGiveAssignment);

module.exports = router;