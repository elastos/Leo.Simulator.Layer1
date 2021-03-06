const IPFS = require('ipfs');
const _ = require( 'lodash');
const {channelListener} = require('./channelListener');
const {generateBlock} = require('./generateBlock');
import PeerUserCache from './onlinePeerUser';
const {utils} = require('vrf.js');
import inquirer from 'inquirer';
import {blockMgr as BlockMgr} from 'leo.simulator.shared';
import o from './logWebUi';
import events from 'events';

exports.start = ()=>{  // Prompt user to input data in console.
  console.clear();
  o('log', "|")
  o('log', "|")
  o('log', "|")
  o('log', "|")
  o('log', "|")
  o('log', "|")
  o('log', "|")
  o('log', "|")
  o('log', "|")
  o('log', "|")
  o('log', "|")
  o('log', "|____________________________________________")

  var questions = [{
    type: 'input',
    name: '',
    message: ""
  }]

  inquirer.prompt([
      {
        type:'input',
        name:'swarmUrl',
        message:'IP address of your IPFS swarm server. Or type "public" for IPFS free server. If leave it blank the defalt is /dns4/127.0.0.1/tcp/9090/wss/p2p-websocket-star',
        default:()=>{
          return '';
        }
      },
      {
        type:'input',
        name:'blockGenerationInterval',
        message:'Please input the interval of auto block generation in seconds or leave it blank to manually generate',
        default:()=>{
          return 0;
        }
      },
      {
        type:'input',
        name:'roomPostfixUserInput',
        message:'In order to prevent conflicts between different testing users, please input a random pubsub room postfix. Leave it blank will auto generate a random number as the default',
        default: ()=>{
          return '';//Math.round(Math.random()*1000).toString();
        }
      }
    ]
  ).then(answers => {
    let swarmUrl;
    if(answers['swarmUrl'] == 'public'){
      swarmUrl = '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star';
    }else if(answers['swarmUrl'] == ''){
      swarmUrl = '/ip4/127.0.0.1/tcp/9090/ws/p2p-websocket-star';
    }else{
      swarmUrl = '/ip4/' + answers['swarmUrl'] + '/tcp/9090/ws/p2p-websocket-star';
    }
    const roomPostfixUserInput = answers['roomPostfixUserInput'];
    const blockGenerationInterval = parseInt(answers['blockGenerationInterval']) * 1000;  
    main(roomPostfixUserInput, blockGenerationInterval, swarmUrl);
    
  });
};


const main = (randRoomPostfix, blockGenerationInterval, swarmUrl)=>{
  ipfsStart(swarmUrl)
  .then((ipfs)=>{
    global.onlinePeerUserCache = new PeerUserCache();
    global.swarmUrl = swarmUrl;
    global.ipfs = ipfs;
    global.blockMgr = new BlockMgr(ipfs);
    global.randRoomPostfix = randRoomPostfix;
    global.rpcEvent = new events.EventEmitter();
    let presetUsers = [];
    for(let i = 0; i < 20; i ++){
      const [publicKey, privateKey] = utils.generatePair();
      const u ={
        name:'user #' + i,
        pub:publicKey.toString('hex'),
        pri:privateKey.toString('hex')
      }
      presetUsers.push(u);
    }
    //
    global.presetUsers = presetUsers;
    return channelListener(randRoomPostfix, presetUsers, global.rpcEvent);
  })
  .then((pubsubRooms)=>{
    global.pubsubRooms = pubsubRooms;
    
    const firstBlockDelay = 1000 * 10;
    if(blockGenerationInterval > 0){
      const loop = async ()=>{
        await generateBlock();
        _.delay(loop, blockGenerationInterval);
      }
      _.delay(loop, firstBlockDelay);
      console.log("Automacial block genreation starts. New block will be generated every" + blockGenerationInterval + ' seconds');
    }
    else{
      _.delay(generateBlock, firstBlockDelay);
      console.log("No automatical block generation after the genesis block. You have to manually force generate new block every time!")
    }

  })
};

const ipfsStart = async (swarmUrl)=>{
  console.log('swarmUrl:|', swarmUrl, '|');
  
  const ipfs = await IPFS.create({
    repo: 'ipfs-storage-no-git/poc/' + Math.random(),
    EXPERIMENTAL: {
      pubsub: true
    },
    config: {
      Addresses: {
        Swarm: [
          //'/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star'
          //'/ip4/127.0.0.1/tcp/9090/ws/p2p-websocket-star'
          swarmUrl
        ]
      }
    }
  });
  console.log('IPFS node is ready');
  ipfs.on('error', error=>{
    console.log('IPFS on error:', error);
  });

  ipfs.on('init', error=>{
    console.log('IPFS on init:', error);
  });
  return ipfs;
};