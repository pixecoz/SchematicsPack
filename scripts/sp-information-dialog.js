module.exports = {
    setupInformationDialog: setupInformationDialog,
}


const constants = require("sp-constants");
const loadSchematicsDialog = require("sp-load-schematics-dialog");
const serializer = require("sp-serializer");


function setupInformationDialog() {
    Vars.ui.schematics.buttons.row();

    Vars.ui.schematics.buttons.button("@scripts.schematics-pack.information", Icon.info, () => {
        var information = new BaseDialog("@scripts.schematics-pack.information");

        const builder = run(() => {
            information.cont.clear();
            information.buttons.clear();

            information.cont.table(cons(t => {
                t.top();
                const width = Core.graphics.getWidth() * Scl.scl(1) / 5;
                t.image(Core.atlas.find(constants.modname + "-" + constants.logoSpriteName)).size(width > 480 ? 480 : width, (width > 480 ? 480 : width) / 2.76).growX();
            })).row();
            // information.cont.table(cons(t => t.labelWrap("@scripts.schematics-pack.mod-information").growX())).width(500).row();
            information.cont.pane(cons(t => {
                t.labelWrap("@scripts.schematics-pack.mod-information").width(Core.graphics.isPortrait() ? 400 : 700).align(Align.center);
            })).width(Core.graphics.isPortrait() ? 400 : 700).align(Align.center);
            //information.cont.labelWrap("@scripts.schematics-pack.mod-information").width(Core.graphics.isPortrait() ? 400 : 700).align(Align.center);
            information.addCloseButton();

            information.buttons.button("@scripts.schematics-pack.discord", Icon.discord, () => {
                if (!Core.app.openURI(constants.discrodURL)) {
                    Vars.ui.showErrorMessage("@linkfail");
                }
            });

            if (Core.graphics.isPortrait()) information.buttons.row();

            information.buttons.button("@scripts.schematics-pack.load-schematics", Icon.download, () => 
            {   
                loadSchematicsDialog.dialog.show();
            });

            information.buttons.button("@scripts.schematics-pack.github-releases", Icon.github, () => {
                if (!Core.app.openURI(constants.githubURL)) {
                    Vars.ui.showErrorMessage("@linkfail");
                }
            });

            if (constants.developer) {
                information.buttons.button("сделать json", () => {
                    try {
                        const resultJson = serializer.serializeDirectory(constants.dirToSerializeName);
                        const resultFile = new Fi(constants.serializedJsonName);
                        resultFile.writeString(JSON.stringify(resultJson, null, 4));
                        
                        Vars.ui.showInfoFade("Success", 2);
                    } catch (e) {
                        Vars.ui.showInfoFade("Error", 2);
                        spprint("error to make json with schematics: " + e);
                    }
                });
            }

            information.show();
        });

        builder.run();
        // information.show();

        Events.on(ResizeEvent, e => {
            if (information.isShown() && Core.scene.getDialog() == information) {
                builder.run();
                information.updateScrollFocus();
            }
        });
    });
}