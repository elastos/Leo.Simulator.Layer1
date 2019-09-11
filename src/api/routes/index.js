const express = require('express');

const pocRoutes = require('./poc.route');

const router = express.Router();

router.use('/', express.static(__dirname + '/docs'));
router.use('/poc', pocRoutes);

// set webprotal folder as static
router.use('/webportal', express.static(process.cwd() + '/webportal'));

module.exports = router;
