const utils = require("sp-utils");
const spprint = utils.spprint;

const constants = require("sp-constants");
const globals = require("sp-globals");
const infoDialog = require("sp-information-dialog");
const startDialog = require("sp-starting-dialog");

const deletedSchematics = require("sp-deleted-schematics-dialog");
const setupDeletedSchematicsDialog = deletedSchematics.setupDeletedSchematicsDialog;


let prevVersion = -1.0;
let versionUpgraded = true;
let firstRunOfVersion1x = false;


initMod();

function initMod() {
    checkInstalledVersion();

    Events.on(EventType.ClientLoadEvent, e => {
        setupUI();
    });

    copySchematicsJsonIfNotPresented();
    deletedSchematics.init();

    // if firstRunOfVersion1x = true, then starting dialog is shown and version updated after click on 'ok' button 
    if (!firstRunOfVersion1x) {
        Core.settings.put(constants.settingsKey, new java.lang.Float(constants.version));
    }
}

function checkInstalledVersion() {
    const curVersion = new java.lang.Float(constants.version).floatValue();
    if (Core.settings.has(constants.settingsKey)) {
        prevVersion = Core.settings.getFloat(constants.settingsKey, -1.0);
        versionUpgraded = prevVersion < curVersion;
        spprint("Settings contains settingsKey: '" + constants.settingsKey + "', previous version: " + prevVersion + ", current version: " + curVersion + ", version upgraded: " + versionUpgraded);
    } else {
        firstRunOfVersion1x = true;
        spprint("Settings do not contains settingsKey: '" + constants.settingsKey + "', put current version: " + curVersion);
        Core.settings.put(constants.settingsKey, new java.lang.Float(curVersion));
    }
}

function setupUI() {
    if (firstRunOfVersion1x) {
        startDialog.setupStartingDialog();
    }
    infoDialog.setupInformationDialog();
    // setupDeletedSchematicsDialog(infoDialog.dialog.buttons);
}

function copySchematicsJsonIfNotPresented() {
    const modJsonFile = Vars.mods.locateMod(constants.modname).root.child("msch/sch.json");
    const localJsonFile = Vars.dataDirectory.child("sp_schematics.json");
    if (!localJsonFile.exists()) {
        localJsonFile.writeString(modJsonFile.readString());
    }
}
