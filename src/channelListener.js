import taskRoomMessageHandler from './taskRoomMessageHandler';
import Room from 'ipfs-pubsub-room';
import townHallJoinLeftHandler from './townHallJoinLeftHandler';
import {utilities} from 'leo.simulator.shared';
import townHallRpcHandler from './townHallRpcHandler'
const {o} = utilities;
const createRandomGeoLocation = (n)=>{
  var data=[];   
  for (var i=0; i < n; i++) {
    var aaa = GetRandomNum(-179,179)+Math.random();
    var bbb = GetRandomNum(-40,89)+Math.random();
    data.push([aaa, bbb]);
  }
  function GetRandomNum(Min,Max){   
    var Range = Max - Min;   
    var Rand = Math.random();   
    return(Min + Math.round(Rand * Range));   
  } 
  return data;
};


const createGenesysBlock = (presetUsers)=>{
  const block = {};
  block.gasMap = {};
  block.creditMap = {};
  block.peerProfile = {};
  let totalGas = 0;
  let totalCredit = 0;

  const locs = createRandomGeoLocation(presetUsers.length);
  for(let i = 0; i < presetUsers.length; i ++){
    const u = presetUsers[i];
    block.gasMap[u.name] = i > 10? i * 100 : 500;
    totalGas += block.gasMap[u.name];
    block.creditMap[u.name] = i > 10? i*10: 50; //
    totalCredit += block.creditMap[u.name];
    block.peerProfile[u.name] = {
      loc : locs[i]
    };
  }
  block.previousBlockHeight = -1;//this is a special case for genesis block, it is -1;
  block.totalGas = totalGas;
  block.totalCredit = totalCredit;
  block.processedTxs = [],
  block.latestBlockHeight = 0;
  block.totalCreditForOnlineNodes = 0,
  block.escrowGasMap = {},
  block.pendingTasks = {}
  return block;

}


exports.channelListener = (randRoomPostfix, presetUsers, rpcEvent)=>{
  const ipfs = global.ipfs;
  //We assume every time we start the demo, it starts from genesis block
  global.globalState = createGenesysBlock(presetUsers);
  const options = {globalState};//default placeholder
  const taskRoom = Room(ipfs, 'taskRoom' + randRoomPostfix);
  taskRoom.on('peer joined', (peer)=>peer);//console.log(console.log('peer ' + peer + ' joined task room')));
  taskRoom.on('peer left', peer=>peer);//console.log('peer ' + peer + ' left task room'));
  taskRoom.on('subscribed', (m) => console.log("...... subscribe task room....", m));
  taskRoom.on('message', taskRoomMessageHandler);
  taskRoom.on('error', (err)=>o('error', `*******   TaskRoom has pubsubroom error,`, err));
  taskRoom.on('stopping', ()=>o('error', `*******   TaskRoom is stopping`));
  taskRoom.on('stopped', ()=>o('error', `*******   TaskRoom is stopped`));

  
  const townHall = Room(ipfs, 'townHall' + randRoomPostfix);
  townHall.on('peer joined', townHallJoinLeftHandler.join(ipfs, townHall, options, presetUsers));
  townHall.on('peer left', townHallJoinLeftHandler.left(ipfs, townHall, options));
  townHall.on('subscribed', (m) => console.log("...... subscribe task room....", m));
  townHall.on('error', (err)=>o('error', `*******   townHall has pubsubroom error,`, err));
  townHall.on('stopping', ()=>o('error', `*******   townHall is stopping`));
  townHall.on('stopped', ()=>o('error', `*******   townHall is stopped`));
  townHall.on('rpcDirect', townHallRpcHandler.rpcDirect);
    
  
  const blockRoom = Room(ipfs, 'blockRoom' + randRoomPostfix);
  blockRoom.on('peer joined', (peer)=>peer);//console.log(console.log('peer ' + peer + ' joined task room')));
  blockRoom.on('peer left', peer=>peer);//console.log('peer ' + peer + ' left task room'));
  blockRoom.on('subscribed', (m) => console.log("...... subscribe task room....", m));
  blockRoom.on('error', (err)=>o('error', `*******   blockRoom has pubsubroom error,`, err));
  blockRoom.on('stopping', ()=>o('error', `*******   blockRoom is stopping`));
  blockRoom.on('stopped', ()=>o('error', `*******   blockRoom is stopped`));


  rpcEvent.on("rpcRequest", townHallRpcHandler.rpcRequest(townHall));
  rpcEvent.on("rpcResponseWithNewRequest", townHallRpcHandler.rpcResponseWithNewRequest(townHall));
  rpcEvent.on("rpcResponse", townHallRpcHandler.rpcResponse(townHall));
  
  return {taskRoom, townHall, blockRoom};
}
