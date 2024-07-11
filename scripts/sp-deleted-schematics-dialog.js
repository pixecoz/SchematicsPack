module.exports = {
    init: init,
    setupDeletedSchematicsDialog: setupDeletedSchematicsDialog,
    loadDeletedSchematics: loadDeletedSchematics,
    updateDeletedSchematics: updateDeletedSchematics,
}

const utils = require("sp-utils");
const spprint = utils.spprint;

const globals = require("sp-globals");
const rememberSchematics = globals.rememberSchematics;
const deletedSchematics = globals.deletedSchematics;
const delSchemDir = globals.delSchemDir;


function init() {
    if (!delSchemDir.exists()) {
        delSchemDir.mkdirs();
    }
    
    const loadedAmount = loadDeletedSchematics();
    spprint("loaded " + loadedAmount + " deleted schematics");
    
    Events.on(EventType.ClientLoadEvent, e => {
        rememberSchematics.addAll(Vars.schematics.all());
    });

    Events.on(SchematicCreateEvent, e => {
        rememberSchematics.add(e.schematic);
    });

    Events.on(DisposeEvent, () => {
        updateDeletedSchematics();
    });
}

function setupDeletedSchematicsDialog(table) {
    table.button("@scripts.schematics-pack.deleted-schematics", Icon.trash, () => {
        updateDeletedSchematics()

        var deletedDialog = new BaseDialog("@scripts.schematics-pack.deleted-schematics-dialog");
        deletedDialog.addCloseButton();

        deletedDialog.buttons.button("@scripts.schematics-pack.delete-all", Icon.trash, run(() => Vars.ui.showConfirm("@confirm", "@scripts.schematics-pack.delete-all-confirm", () => {
            deletedSchematics.each(s => {
                s.file.delete();
                rememberSchematics.remove(s);
            });
            deletedSchematics.clear();
            if (rebuildPane[0] != null) rebuildPane[0].run();

        })));

        const rebuildPane = [null];
        deletedDialog.cont.pane(p => {

            rebuildPane[0] = run(() => {
                p.clear();

                p.top();
                p.margin(20);
                const cols = Mathf.round(Core.graphics.getWidth() / Scl.scl(300));
                if (cols < 1) cols = 1;

                if (deletedSchematics.size == 0) {
                    p.add("@scripts.schematics-pack.empty-deleted-schematics");
                    return;
                }

                for (let i = 0; i < deletedSchematics.size; i++) {

                    const sel = [null];
                    const schem = deletedSchematics.get(i);

                    sel[0] = p.button(cons(b => {

                        b.table(cons(t => {
                            t.left();
                            // t.table(Styles.black3, cons(c => {
                            //     c.label(prov(() => schem.name().length() > 12 ? schem.name.length())).style(Styles.outlineLabel)
                            //     .color(Color.white)
                            //     .top()
                            //     .growX()
                            //     .maxWidth(200 - 8);
                            // })).growX().margin(1).pad(4).maxWidth(Scl.scl(200 - 8)).padBottom(0);
                            // t.add(schem.name().length > 15 ? schem.name().substring(0, 11) + "..." : schem.name());
                            // t.add(schem.name()).growX();

                            t.table(cons(n => {
                                n.top();
                                n.table(cons(c => {
                                    const label = c.add(schem.name()).style(Styles.outlineLabel).color(Color.white).top().growX().maxWidth(150 - 8).get();
                                    label.setEllipsis(true);
                                    label.setAlignment(Align.center);
                                })).growX().margin(1).pad(4).maxWidth(Scl.scl(160 - 8)).padBottom(0);;
                            })).size(150, 30);


                            t.button(Icon.trash, Styles.squareTogglei, () => Vars.ui.showConfirm("@confirm", Core.bundle.format("scripts.schematics-pack.schematics-delete-confirm", schem.name()), () => {
                                deletedSchematics.remove(schem);
                                rememberSchematics.remove(schem);
                                schem.file.delete();

                                rebuildPane[0].run();
                            })).growX().margin(1).width(30);

                        })).top().pad(4);
                        b.row()
                        b.table(cons(t => {
                            t.center();
                            try {
                                Vars.schematics.getBuffer(schem);
                                t.add(new SchematicsDialog.SchematicImage(schem)).margin(1).size(140);
                            } catch (e) {
                                spprint(e);
                                t.image(Core.atlas.find("error"));
                            }
                        }));

                    }), () => Vars.ui.showConfirm("@confirm", Core.bundle.format("scripts.schematics-pack.schematics-restore-confirm", schem.name()), () => {
                        deletedSchematics.remove(schem);
                        // spprint("rememberSchematics schem " + schem.name() + " " + rememberSchematics.contains(schem))
                        if (!rememberSchematics.contains(schem)) rememberSchematics.add(schem);
                        schem.file.delete();

                        Vars.schematics.add(schem);
                        rebuildPane[0].run();

                    })).pad(4).size(200, 200).style(Styles.defaulti);

                    // sel[0].image(new TextureRegion(Vars.schematics.getPreview(schem)));

                    if ((i + 1) % cols == 0) p.row();
                }
            });
            rebuildPane[0].run();

        }).scrollX(false);

        deletedDialog.show();
    });
}


function loadDeletedSchematics() {
    const list = delSchemDir.list();
    let count = 0;

    for (let fi of list) {
        try {
            const s = Vars.schematics.read(fi);
            deletedSchematics.add(s);
            count++;
        } catch (e) {
            spprint("failed to load deleted schematic '" + fi.name() + "': " + e);
        }
    }

    return count;
}

/**
 * updates array of deleted schematics based on schematics that player have had when loaded the game
 * and schematics that player currently have. If something was on start and not presented now means 
 * player delete it.
 */
function updateDeletedSchematics() {
    rememberSchematics.each(sch => {
        if (Vars.schematics.all().contains(sch) || deletedSchematics.contains(sch)) {
            return;
        }
        try {
            const file = delSchemDir.child(Time.millis() + "." + Vars.schematicExtension);
            Vars.schematics.write(sch, file);
            sch.file = file;
            deletedSchematics.add(sch);
        } catch (e) {
            spprint("error while trying to put schematic into recycle bin: " + e);
        }
    });
}
