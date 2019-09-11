

import {utilities} from 'leo.simulator.shared';

const express = require('express');

const {generateBlock} = require('../../generateBlock.js');
const _ = require('lodash');
const router = express.Router();

const {o, tryParseJson} = utilities;

const result = (res, code, dataOrError, message='')=>{
  const json = {
    code, message
  };
  if(code > 0){
    json.data = dataOrError;
  }
  else{
    json.error = dataOrError;
  }
  res.set('Content-Type', 'application/json');
  return res.json(json);
};

router
  .route('/')
  .get(async (req, res) => {
    const ipfs = global.ipfs;
    const globalState = global.globalState;
    const rooms = global.pubsubRooms;
    const {blockRoom} = rooms;
    const newBlock = await generateBlock({ipfs, globalState, blockRoom})
    const htmlDoc = '<html><head><link href="/css/jsoneditor.min.css" rel="stylesheet" type="text/css"><script src="/dist/jsoneditor.min.js"></script></head>'
     + '<body><h1>Block Height:' + newBlock.blockHeight + '</h1><p>Refresh this page to generate next block</p><div id="jsoneditor"></div><script>var container = document.getElementById("jsoneditor");var editor = new JSONEditor(container, {});editor.set('
     + JSON.stringify(newBlock)
    + ')</script></body></html>';
    res.status(200).send(htmlDoc);
  });

router.route('/pot_data').get((req, res)=>{
  const rs = getData();
  return result(res, 1, rs);
});
router.route('/pot_log').get((req, res)=>{
  const rs = get();
  return result(res, 1, rs);
});
router.route('/pot_log_update').post((req, res)=>{
  const type = req.query.type;
  const opts = req.body;

  log(type, opts);
  return result(res, 1, 'ok');
});


module.exports = router;
