Events.on(EventType.ClientLoadEvent, e => { 
Vars.ui.schematics.buttons.button("@scripts.schematics-pack.information",Icon.info,()=>{ 
var information = new BaseDialog("@scripts.schematics-pack.modinformation"); 
information.cont.add("@scripts.schematics-pack.mod-information").row(); 
information.addCloseButton(); 
information.show();
information.buttons.button("@scripts.schematics-pack.discord",Icon.discord,()=>{ 
if(!Core.app.openURI("https://discord.gg/P8zbP8xN8D")){ 
 Vars.ui.showErrorMessage("@linkfail"); 
 } 
 });
}); 
})
