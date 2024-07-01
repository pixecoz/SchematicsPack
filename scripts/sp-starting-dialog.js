module.exports = {
    setupStartingDialog: setupStartingDialog,
}


function setupStartingDialog() {
    var startingDialog = new BaseDialog("@scripts.schematics-pack.starting-dialog");

    startingDialog.buttons.defaults().size(210, 64);
    startingDialog.buttons.button("@ok", () => {
        startingDialog.hide();
        
        // deleteOldSchematics();
    }).size(210, 64);

    startingDialog.addCloseListener();

    startingDialog.cont.table(cons(t => {
        t.top();
        const width = Core.graphics.getWidth() * Scl.scl(1) / 5;
        t.image(Core.atlas.find(constants.modname + "-" + constants.logoSpriteName)).size(width > 480 ? 480 : width, (width > 480 ? 480 : width) / 2.76).growX();
    })).row();

    startingDialog.cont.pane(cons(t => {
        t.labelWrap("@scripts.schematics-pack.starting-dialog-text").width(Core.graphics.isPortrait() ? 400 : 700).align(Align.center);
    })).width(Core.graphics.isPortrait() ? 400 : 700).align(Align.center);

    startingDialog.show();
}


function deleteOldSchematics() {
    const all = Vars.schematics.all();
    const toRemove = new Seq();
    for (let i = 0; i < all.size; i++) {
        let s = all.get(i);
        if (s.name().includes("[#ffa77a99]")) {
            toRemove.add(s);
        }
    }
    
    for (let i = 0; i < toRemove.size; i++) {
        let s = toRemove.get(i);
        spprint("delete old mod schematic: [" + s.name() + "] [" + s.description() + "]");
        rememberSchematics.remove(s);
        Vars.schematics.remove(s);
    }

    spprint("deleted total", toRemove.size, "old mod schematics")
}