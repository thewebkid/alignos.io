export const track = (event, args)=>{
  try{
    // Defensive check: respect notrack flag even if script loaded somehow
    if (typeof localStorage !== 'undefined' && localStorage.getItem('notrack') === 'true') {
      return;
    }
    if (window.umami){
      window.umami.track(event, args);
    }
  }catch(ex){
    console.warn(`umami track ${event} error`);
  }
}
