const constants = require("sp-constants");

module.exports = {
    // array of schematics that player have had when loaded the game and created during current game session
    rememberSchematics: new Seq(),
    // array of schematics that can be seen in 'deleted schematics' dialog
    deletedSchematics: new Seq(),
    delSchemDir: Vars.dataDirectory.child(constants.deletedSchematicsDirName),
}