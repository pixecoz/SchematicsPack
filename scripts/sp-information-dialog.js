module.exports = {
    setupInformationDialog: setupInformationDialog,
    dialog: null
}


const constants = require("sp-constants");
const loadSchematicsDialog = require("sp-load-schematics-dialog");
const serializer = require("sp-serializer");
const utils = require("sp-utils");
const spprint = utils.spprint;

const deletedSchematics = require("sp-deleted-schematics-dialog");
const setupDeletedSchematicsDialog = deletedSchematics.setupDeletedSchematicsDialog;

function setupInformationDialog() {
    if (Core.graphics.isPortrait()) Vars.ui.schematics.buttons.row();
    

    Vars.ui.schematics.buttons.button("", new TextureRegionDrawable(Core.atlas.find(constants.modname + "-sp-button-icon")), () => {
        let information = new BaseDialog("@scripts.schematics-pack.information");
        module.exports.dialog = information;
        spprint("set dialog")

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

            information.buttons.button("@scripts.schematics-pack.load-schematics", Icon.download, () => {   
                loadSchematicsDialog.dialog.show();
            });

            information.buttons.button("@scripts.schematics-pack.github-releases", Icon.github, () => {
                if (!Core.app.openURI(constants.githubURL)) {
                    Vars.ui.showErrorMessage("@linkfail");
                }
            });

            if (constants.developer) {
                if (Core.graphics.isPortrait()) information.buttons.row();
                information.buttons.button("сделать json", () => {
                    try {
                        const resultJson = serializer.serializeDirectory(constants.dirToSerializeName);
                        const resultFile = new Fi(constants.serializedJsonName);
                        const resultString = JSON.stringify(resultJson, null, 4);
                        resultFile.writeString(resultString);

                        const metaFile = new Fi(constants.serializedMetaName);
                        serializer.serializeMeta(metaFile, resultString);

                        Vars.ui.showInfoFade("Success", 3);
                    } catch (e) {
                        Vars.ui.showInfoFade("Error", 3);
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

        setupDeletedSchematicsDialog(information.buttons);
    }).width(64).marginLeft(15);
}