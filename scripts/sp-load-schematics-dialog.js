module.exports = {
    dialog: null
}

setupDialog();

function setupDialog() {
    let loadSchematicsDialog = new BaseDialog("@scripts.schematics-pack.loading");
    module.exports.dialog = loadSchematicsDialog;

    loadSchematicsDialog.addCloseButton();
    loadSchematicsDialog.cont.button("@aboba", Icon.planet, () => {

    }).size(210, 64);
    loadSchematicsDialog.cont.row();
    loadSchematicsDialog.cont.button("@aboba", Icon.planet, () => {

    }).size(210, 64);
}