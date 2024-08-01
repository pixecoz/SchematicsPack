module.exports = {
    getLinksDialog: getLinksDialog,
}

const constants = require("sp-constants");

function getLinksDialog() {  // -> BaseDialog
    const dialog = new BaseDialog("@scripts.schematics-pack.links");
    const discordButton = dialog.cont.button("@scripts.schematics-pack.discord", Icon.discord, () => {
        if (!Core.app.openURI(constants.discrodURL)) {
            Vars.ui.showErrorMessage("@linkfail");
        }
    }).size(210, 64).get();

    Core.atlas.find(constants.modname + "-button").splits =
        Core.atlas.find(constants.modname + "-button-down").splits =
        Core.atlas.find(constants.modname + "-button-over").splits = Core.atlas.find("flat-down-base").splits;

    const styleCopy = new TextButton.TextButtonStyle(discordButton.getStyle());
    styleCopy.up = Core.atlas.drawable(constants.modname + "-button");
    styleCopy.down = Core.atlas.drawable(constants.modname + "-button-down");
    styleCopy.over = Core.atlas.drawable(constants.modname + "-button-over");
    discordButton.setStyle(styleCopy);

    dialog.cont.row();

    dialog.cont.button("@scripts.schematics-pack.github-releases", Icon.github, () => {
        if (!Core.app.openURI(constants.githubURL)) {
            Vars.ui.showErrorMessage("@linkfail");
        }
    }).size(210, 64);

    dialog.addCloseButton();

    return dialog;
}