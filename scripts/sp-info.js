const utils = require("sp-utils");
const spprint = utils.spprint;

const constants = require("sp-constants");
const globals = require("sp-globals");
const infoDialog = require("sp-information-dialog");
const startDialog = require("sp-starting-dialog");

const deletedSchematics = require("sp-deleted-schematics-dialog");
const loadDeletedSchematics = deletedSchematics.loadDeletedSchematics;
const updateDeletedSchematics = deletedSchematics.updateDeletedSchematics;
const setupDeletedSchematicsDialog = deletedSchematics.setupDeletedSchematicsDialog;

const rememberSchematics = globals.rememberSchematics;
const delSchemDir = globals.delSchemDir;


// version to determine if mod was updated, not related to version in mod.hjson
const version = 1.0625;
let prevVersion = -1.0;
let versionUpgraded = true;
let firstRunOfVersion1x = true;
// [#ffa77a99]


initMod();

function initMod() {
    if (!delSchemDir.exists()) {
        delSchemDir.mkdirs();
    }

    checkInstalledVersion();

    const loadedAmount = loadDeletedSchematics();
    spprint("loaded " + loadedAmount + " deleted schematics");
    
    Events.on(EventType.ClientLoadEvent, e => {
        rememberSchematics.addAll(Vars.schematics.all());
        setupUI();
    });

    Events.on(SchematicCreateEvent, e => {
        rememberSchematics.add(e.schematic);
    });

    Events.on(DisposeEvent, () => {
        updateDeletedSchematics();
    });
}

function checkInstalledVersion() {
    if (Core.settings.has(constants.settingsKey)) {
        prevVersion = Core.settings.getFloat(constants.settingsKey, -1.0);
        versionUpgraded = prevVersion < version;
        spprint("Settings contains settingsKey: '" + constants.settingsKey + "', previous version: " + prevVersion + ", current version: " + version + ", version upgraded: " + versionUpgraded);
    } else {
        firstRunOfVersion1x = true;
        spprint("Settings do not contains settingsKey: '" + constants.settingsKey + "', put current version: " + version);
        Core.settings.put(constants.settingsKey, new java.lang.Float(version));
    }
}

function setupUI() {
    if (firstRunOfVersion1x) {
        startDialog.setupStartingDialog();
    }
    infoDialog.setupInformationDialog();
    setupDeletedSchematicsDialog();
}
