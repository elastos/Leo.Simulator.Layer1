
export default (type, ... messages) =>{
  switch(type){
    case 'err':
    case 'error':
      console.error(...messages);
      global.log('error', messages[0])
      break;
    case 'info':
      console.log(...messages);
      global.log('info', messages[0])
      break;
    case 'log':
    case 'debug':
      console.log(...messages);
      
      break;
    case 'warning':
      console.log(...messages);
      global.log('warning', messages[0])
      break;
    case 'status':
      console.log(...messages);
      global.log('status', messages[0]);
      break;
    case 'data':
      global.log('data', messages[0]);
      break;
    default:
      console.log(...messages);
  }
}