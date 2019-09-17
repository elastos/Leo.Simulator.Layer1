import {utilities} from 'leo.simulator.shared';
const { tryParseJson} = utilities;
import o from './logWebUi';
import {generateBlock} from './generateBlock';

const webUiAction = ({from, guid, messageObj})=>{
  if(from != global.webUiPeerId){
    return o('error', 'Only WebUi peer can send me the webUiAction message.')
  }
  const {initiatorUserName, action} = messageObj;	
  const onlineUserInfo = global.onlinePeerUserCache.getByUserName(initiatorUserName);	
  if(! onlineUserInfo)	
    return global.rpcEvent.emit('rpcResponse',{sendToPeerId:from, message: null , guid, err:'cannot find this online user:' + initiatorUserName});
    
  const newWrapper = {	
    type:'simulatorRequestAction',	
    action	
  }	
  global.pubsubRooms.townHall.rpcRequest(onlineUserInfo.peerId, JSON.stringify(newWrapper), (result, error)=>{	
    console.log("response from initiator", result, error);	
    if(error){	
      return global.rpcEvent.emit('rpcResponse',{sendToPeerId:from, message: null , guid, err:error});
    }	
    else{	
      global.rpcEvent.emit('rpcResponse',{sendToPeerId:from, message:`{res:'ok'}`, guid});
      o('log', 'I have response WebUi OK');
    }	
  });	  
};

const webUiGenerateBlock =  ({from, guid, messageObj})=>{
  
  const asyncWrapper = async ()=>{
    const ipfs = global.ipfs;
    const globalState = global.globalState;
    const rooms = global.pubsubRooms;
    const {blockRoom} = rooms;
    await generateBlock({ipfs, globalState, blockRoom});
    global.rpcEvent.emit('rpcResponse',{sendToPeerId:from, message:`{res:'ok'}`, guid});
    
    return ;//o('log', 'I have response WebUi OK');
  }
  try{
    asyncWrapper();
  }
  catch(e){
    return global.rpcEvent.emit('rpcResponse',{sendToPeerId:from, message: null , guid, err:'WebUi ask layer one generate new block exception:' + e.toString()});
  }
};

const ping = ({from, guid})=>{
  o('debug', `I receive another peer ${from} ping. I response my userInfo`);
  const resMessage = {
    type:'pong',
    userInfo:null,
    specialRole:'LayerOneBlockChain'
  };
  global.rpcEvent.emit('rpcResponse', {
    sendToPeerId: from,
    message: JSON.stringify(resMessage),
    guid
  });
};

const rpcDirectHandler = {
  webUiAction, webUiGenerateBlock, ping
}

exports.rpcDirect = (message) => {
  //o('log', 'In townhall got RPC message from ' + message.from + ': ', message);
  if(! message.guid || ! message.verb)
    return console.log("twonHall RPC handler got a message not standard RPC,", message);
  const messageObj = tryParseJson(message.data.toString());
  if(! messageObj)
    return console.log("townHallMessageHandler received non-parsable message, ", messageString);
  
  const handlerFunction = rpcDirectHandler[messageObj.type];
  try {
      if(typeof handlerFunction == 'function'){
      handlerFunction({from:message.from, guid:message.guid, messageObj});
      return
    }
    else{
      return console.log("townHallMessageHandler received unknown type message object,", messageObj );
    }
  }
  catch(e){
    return console.error('executing handlerFunction inside townhall has exception:', e);
  }
}

exports.rpcResponseWithNewRequest = (room)=>(args)=>{
  const {sendToPeerId, message, guid, responseCallBack, err} = args;
  room.rpcResponseWithNewRequest(sendToPeerId, message, guid, responseCallBack, err);
}
exports.rpcRequest = (room)=>(args)=>{
  const {sendToPeerId, message, responseCallBack} = args;
  // sendToPeerId:tx.ipfsPeerId, 
  // message:JSON.stringify(raReqObj), 
  // responseCallBack:handleRaResponse
  room.rpcRequest(sendToPeerId, message, responseCallBack);
}
exports.rpcResponse =  (room)=>(args)=>{
  const {sendToPeerId, message, guid, err} = args;
  room.rpcResponse(sendToPeerId, message, guid, err);
}