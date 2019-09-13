import {utilities} from 'leo.simulator.shared';
const {o, tryParseJson} = utilities;

const webUiAction = ({from, guid, messageObj})=>{
  if(from != global.webUiPeerId){
    return o('error', 'Only WebUi peer can send me the webUiAction message.')
  }
  o('log', 'I have got WebUi message', messageObj);
  global.rpcEvent.emit('rpcResponse',{sendToPeerId:from, message:`{res:'ok'}`, guid});
  o('log', 'I have response WebUi OK');
}

const rpcDirectHandler = {
  webUiAction
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
  o('debug', 'inside exports.rpcResponse:', sendToPeerId, message, guid, err);
  room.rpcResponse(sendToPeerId, message, guid, err);
}