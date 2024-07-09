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
let firstRunOfVersion1x = true;


initMod();

function initMod() {
    checkInstalledVersion();

    Events.on(EventType.ClientLoadEvent, e => {
        setupUI();
    });

    Events.on(DisposeEvent, () => {
        Core.settings.put(constants.settingsKey, new java.lang.Float(constants.version));
    });

    copySchematicsJsonIfNotPresented();
    deletedSchematics.init();
}

function checkInstalledVersion() {
    if (Core.settings.has(constants.settingsKey)) {
        prevVersion = Core.settings.getFloat(constants.settingsKey, -1.0);
        versionUpgraded = prevVersion < constants.version;
        spprint("Settings contains settingsKey: '" + constants.settingsKey + "', previous version: " + prevVersion + ", current version: " + constants.version + ", version upgraded: " + versionUpgraded);
    } else {
        firstRunOfVersion1x = true;
        spprint("Settings do not contains settingsKey: '" + constants.settingsKey + "', put current version: " + constants.version);
        Core.settings.put(constants.settingsKey, new java.lang.Float(constants.version));
    }
}

function setupUI() {
    if (firstRunOfVersion1x) {
        startDialog.setupStartingDialog();
    }
    infoDialog.setupInformationDialog();
    setupDeletedSchematicsDialog();
}

function copySchematicsJsonIfNotPresented() {
    const modJsonFile = Vars.mods.locateMod(constants.modname).root.child("msch/sch.json");
    const localJsonFile = Vars.dataDirectory.child("sp_schematics.json");
    if (!localJsonFile.exists()) {
        localJsonFile.writeString(modJsonFile.readString());
    }
}
