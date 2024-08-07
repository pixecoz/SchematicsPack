module.exports = {
    overrideSchematicButtons: overrideSchematicButtons
}
const { spprint } = require("sp-utils");

let currentSchematic = null;

function overrideSchematicButtons() {
    const infoField = Vars.ui.schematics.getClass().getDeclaredField("info");
    infoField.setAccessible(true);
    const infoDialog = infoField.get(Vars.ui.schematics);
    

    infoDialog.shown(run(() => {
        // SchematicsDialog.SchematicImage
        const schematicImage = infoDialog.cont.getCells().get(2).get();
        currentSchematic = getSchematicFromSchematicImage(schematicImage);
        
        infoDialog.buttons.clearChildren()

        infoDialog.buttons.defaults().size(Core.graphics.isPortrait() ? 150 : 210, 64);
        infoDialog.buttons.button("@back", Icon.left, run(() => Core.scene.getDialog().hide()));
        infoDialog.buttons.button("@editor.export", Icon.upload, run(() => Vars.ui.schematics.showExport(currentSchematic)));
        infoDialog.buttons.button("@edit", Icon.edit, run(() => showEdit(currentSchematic)));
    }));   

    Vars.ui.schematics.shown(run(() => {
        const scrollPane = Vars.ui.schematics.cont.getCells().get(2).get();
        const buttonsCells = scrollPane.getWidget().getCells();

        if (buttonsCells.size == 1 && (buttonsCells.get(0).get() instanceof Label)) {
            // player has no shcematics
            return;
        }

        for (let i = 0; i < buttonsCells.size; i++) {
            let schematicButton = buttonsCells.get(i).get();
            let cells = schematicButton.getCells();
            let buttonsOverSchematic = cells.get(0).get();
            let schematic = getSchematicFromSchematicImage(schematicButton.getCells().get(1).get().getChildren().get(0));
            buildButtonsOverShematic(buttonsOverSchematic, schematic);
        }
    }))
}

function getSchematicFromSchematicImage(schematicImage) {
    const schematicField = schematicImage.getClass().getDeclaredField("schematic");
    schematicField.setAccessible(true);
    const schematic = schematicField.get(schematicImage);
    return schematic;
}

function buildButtonsOverShematic(buttons /* Table */, s /* Schematic */) {
    buttons.clearChildren();

    buttons.left();
    buttons.defaults().size(50);

    let style = Styles.emptyi;

    buttons.button(Icon.info, style, () => Vars.ui.schematics.showInfo(s)).tooltip("@info.title")
    buttons.button(Icon.upload, style, () => Vars.ui.schematics.showExport(s)).tooltip("@editor.export");
    buttons.button(Icon.pencil, style, () => showEdit(s)).tooltip("@schematic.edit");

    if(s.hasSteamID()){
        buttons.button(Icon.link, style, () => Vars.platform.viewListing(s)).tooltip("@view.workshop");
    }else{
        buttons.button(Icon.trash, style, () => {
            if(s.mod != null){
                Vars.ui.showInfo(Core.bundle.format("mod.item.remove", s.mod.meta.displayName));
            }else{
                Vars.ui.showConfirm("@confirm", "@schematic.delete.confirm", () => { 
                    Vars.schematics.remove(s);
                    // rebuildPane.run(); TODO
                });
            }
        }).tooltip("@save.delete");
    } 
}

function showEdit(schem /* Schematic */) {
    const buildTagsMethod = Vars.ui.schematics.getClass().getDeclaredMethod("buildTags", [Schematic, Table, java.lang.Boolean.TYPE]);
    buildTagsMethod.setAccessible(true);

    const dialog = new BaseDialog("@schematic.edit");
    dialog.setFillParent(true);
    dialog.addCloseListener();

    dialog.cont.margin(30);

    dialog.cont.add("@schematic.tags").padRight(6);
    dialog.cont.table(cons(tags => buildTagsMethod.invoke(Vars.ui.schematics, schem, tags, false))).maxWidth(400).fillX().left().row();

    dialog.cont.margin(30).add("@name").padRight(6);
    const nameField = dialog.cont.field(schem.name(), null).size(400, 55).left().get();

    dialog.cont.row();

    dialog.cont.margin(30).add("@editor.description").padRight(6);
    const descFieldCell = dialog.cont.area(schem.description(), Styles.areaField, cons(t => {})).left().growX().growY();
    const descField = descFieldCell.get();

    const accept = run(() => {
        schem.tags.put("name", nameField.getText());
        schem.tags.put("description", descField.getText());
        schem.save();
        dialog.hide();
        // rebuildPane.run(); TODO
    });

    dialog.buttons.defaults().size(210, 64).pad(4);
    dialog.buttons.button("@ok", Icon.ok, accept).disabled(b => nameField.getText().length == 0);
    dialog.buttons.button("@cancel", Icon.cancel, run(() => dialog.hide()));

    dialog.keyDown(KeyCode.enter, run(() => {
        if(!nameField.getText().isEmpty() && Core.scene.getKeyboardFocus() != descField){
            accept.run();
        }
    }));

    dialog.show();
}