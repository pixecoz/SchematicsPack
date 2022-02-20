const version = 1.0;
const settingsKey = "scheme-pack-v";
var shouldLoad = true;
const alwaysLoad = false;
const _modname = "schematics-pack";
const folder = "msch";
const discrodURL = "https://discord.gg/P8zbP8xN8D";
const spriteName = "schematics-pack";
const githubURL = "https://github.com/pixecoz/MindustrySchematics/releases"

const startingSchematics = new Seq();
const deletedSchematics = new Seq();
const delSchemDir = Vars.dataDirectory.child("deleted_schematics");

if (!delSchemDir.exists()) {
    delSchemDir.mkdirs();
}

// print("DATA_DIRECTORY=" + Vars.dataDirectory)



function stileString(stile) {
    return "Stile{" +
        "block=" + stile.block +
        ", x=" + stile.x +
        ", y=" + stile.y +
        ", config=" + stile.config +
        ", config class=" + (stile.config == null ? "-" : stile.config.getClass().getSimpleName()) +
        ", rotation=" + stile.rotation +
        "}";
}

function configsEqual(conf1, conf2) {

    if (conf1 == null && conf2 != null ||
        conf1 != null && conf2 == null) return false;
    if (conf1 == null && conf2 == null) return true;

    if (conf1 == conf2) return true;

    if (conf1.getClass() != conf2.getClass()) return false;

    if (conf1 instanceof Packages.java.lang.String) return conf1.equals(conf2);

    if (conf1 instanceof Content)
        return conf1.id == conf2.id &&
            conf1.getContentType().ordinal() == conf2.getContentType().ordinal();

    if (conf1 instanceof IntSeq) {
        if (conf1.size != conf2.size) return false
        for (var i = 0; i < conf1.size; i++) {
            if (conf1.items[i] != conf2.items[i]) return false;
        }
        return true;
    }

    if (conf1 instanceof Point2)
        return conf1.x == conf2.x && conf1.y == conf2.y;

    if (conf1.getClass().getSimpleName().equals("Point2[]")) {
        if (conf1.length != conf2.length) return false;
        for (var i = 0; i < conf1.length; i++) {
            if (conf1[i].x != conf2[i].x || conf1[i].y != conf2[i].y) return false;
        }
        return true
    }

    if (conf1 instanceof TechTree.TechNode)
        return conf1.content.id == conf2.content.id &&
            conf1.content.getContentType().ordinal() == conf2.content.getContentType().ordinal()

    if (conf1 instanceof Building)
        return conf1.pos() == conf2.pos();

    if (conf1 instanceof LAccess)
        return conf1.ordinal() == conf2.ordinal();

    if (conf1.getClass().getSimpleName().equals("byte[]")) {
        if (conf1.length != conf2.length) return false;
        for (var i = 0; i < conf1.length; i++) {
            if (conf1[i] != conf2[i]) return false;
        }
        return true
    }

    if (conf1 instanceof UnitCommand)
        return conf1.ordinal() == conf2.ordinal();

    if (conf1 instanceof BuildingBox)
        return conf1.pos == conf2.pos;

    return ((typeof conf1.equals !== "undefined") && conf1.equals(conf2)) ||
        ((typeof conf2.equals !== "undefined") && conf2.equals(conf1));
}

function tilesEqual(schem1, schem2, sort) {

    const tiles1 = schem1.tiles;
    const tiles2 = schem2.tiles;
    const len = tiles1.size;

    if (len != schem2.tiles.size || schem1.width != schem2.width || schem1.height != schem2.height) return false;

    if (sort) {
        tiles1.sort(floatf(st => st.y * schem1.width + st.x));
        tiles2.sort(floatf(st => st.y * schem2.width + st.x));
    }

    var t1 = null, t2 = null;
    for (var i = 0; i < len; i++) {
        t1 = tiles1.get(i), t2 = tiles2.get(i);

        if (t1.block != t2.block || t1.x != t2.x || t1.y != t2.y ||
            t1.rotation != t2.rotation || !configsEqual(t1.config, t2.config)) {

            // print(stileString(t1) + " != " + stileString(t2));
            return false

        }
    }
    return true;
}

function loadSchematics() {
    const mod = Vars.mods.getMod(_modname);
    const file = mod.root.child(folder);
    var total = 0;
    var added = 0;
    if (file.exists()) {

        const list = file.list();
        const all = Vars.schematics.all();

        all.each(s => s.tiles.sort(floatf(st => st.y * s.width + st.x)))

        for (var i in list) {

            try {
                const s = Vars.schematics.read(list[i]);
                s.tiles.sort(floatf(st => st.y * s.width + st.x))
                total++;

                if (!all.contains(boolf(sch => tilesEqual(sch, s, false)))) {
                    Vars.schematics.add(s);
                    added++;
                }

            } catch (e) {
                print("failed to copy schematic: " + e);
            }

        }
    }
    return [total, added];
}

function loadDeletedSchematics() {

    const list = delSchemDir.list();
    var count = 0;

    for (var i in list) {
        try {
            const s = Vars.schematics.read(list[i]);
            // s.file = list[i];
            deletedSchematics.add(s);
            count++;

        } catch (e) {
            print("failed to load deleted schematic: " + e);
        }
    }

    return count;
}

function updateDeletedSchematics() {
    startingSchematics.each(sch => {
        // print("processed schematic '" + sch.name() + "'");
        // print("all: " 

        if (!Vars.schematics.all().contains(sch) && !deletedSchematics.contains(sch)) {
            try {
                const file = delSchemDir.child(Time.millis() + "." + Vars.schematicExtension);
                Vars.schematics.write(sch, file);
                sch.file = file;

                deletedSchematics.add(sch);
            } catch (e) {
                print(e);
            }
        }

    });
}


if (Core.settings.has(settingsKey)) {
    shouldLoad = Core.settings.getFloat(settingsKey, -1.0) < version;
    print("SCHEMATICS-PACK Settings contains settingsKey: '" + settingsKey + "'");
    print("SCHEMATICS-PACK previous version:" + Core.settings.getFloat(settingsKey, -1.0) + ", current version:" + version);

} else {
    print("SCHEMATICS-PACK Settings do not contains settingsKey: '" + settingsKey + "'");
    Core.settings.put(settingsKey, new java.lang.Float(version));
    print("SCHEMATICS-PACK putted version:" + version);
}


if (shouldLoad || alwaysLoad) {
    Events.on(ClientLoadEvent, e => {
        var a = loadSchematics();
        print("SCHEMATICS-PACK Schematics loaded automatically");
        print("total schematics files: " + a[0] + "   added schematics: " + a[1]);
    });
}

const loaded = loadDeletedSchematics();
print("SCHEMATICS-PACK loaded " + loaded + " deleted schematics");


Events.on(EventType.ClientLoadEvent, e => {

    startingSchematics.addAll(Vars.schematics.all());


    Vars.ui.schematics.buttons.row();
    Vars.ui.schematics.buttons.button("@scripts.schematics-pack.information", Icon.info, () => {

        var information = new BaseDialog("@scripts.schematics-pack.information");
        const builder = run(() => {
            information.cont.clear();
            information.buttons.clear();

            information.cont.table(cons(t=>{
            	t.top();
	            const width = Core.graphics.getWidth()*Scl.scl(1)/5;
				t.image(Core.atlas.find(_modname + "-" + spriteName)).size(width > 480 ? 480 : width, (width > 480 ? 480 : width)/2.76).growX();
			})).row();
            // information.cont.table(cons(t => t.labelWrap("@scripts.schematics-pack.mod-information").growX())).width(500).row();
            information.cont.pane(cons(t=>{
				t.labelWrap("@scripts.schematics-pack.mod-information").width(Core.graphics.isPortrait() ? 400 : 700).align(Align.center);
			})).width(Core.graphics.isPortrait() ? 400 : 700).align(Align.center);
            //information.cont.labelWrap("@scripts.schematics-pack.mod-information").width(Core.graphics.isPortrait() ? 400 : 700).align(Align.center);
            information.addCloseButton();
    
            information.buttons.button("@scripts.schematics-pack.discord", Icon.discord, () => {
                if (!Core.app.openURI(discrodURL)) {
                    Vars.ui.showErrorMessage("@linkfail");
                }
            });
    
            if(Core.graphics.isPortrait()) information.buttons.row();
    
            information.buttons.button("@scripts.schematics-pack.load-schematics", Icon.download, () => Vars.ui.showConfirm("@confirm", "@scripts.schematics-pack.schematics-confirm", () => {
                var a = loadSchematics();
                print("SCHEMATICS-PACK Schematics loaded by player");
                print("total schematics files: " + a[0] + "   added schematics: " + a[1]);
            }));
    
            information.buttons.button("@scripts.schematics-pack.github-releases", Icon.github, () => {
                if (!Core.app.openURI(githubURL)) {
                    Vars.ui.showErrorMessage("@linkfail");
                }
            });
    
            information.show();
        });

        builder.run();
        // information.show();

        Events.on(ResizeEvent, e => {
            if(information.isShown() && Core.scene.getDialog() == information){
                builder.run();
                information.updateScrollFocus();
            }
        });


    });
    Vars.ui.schematics.buttons.button("@scripts.schematics-pack.deleted-schematics", Icon.trash, () => {

        updateDeletedSchematics()

        var deletedDialog = new BaseDialog("@scripts.schematics-pack.deleted-schematics-dialog");
        deletedDialog.addCloseButton();

        deletedDialog.buttons.button("@scripts.schematics-pack.delete-all", Icon.trash, run(() => Vars.ui.showConfirm("@confirm", "@scripts.schematics-pack.delete-all-confirm", () => {

            deletedSchematics.each(s => {
                s.file.delete();
                startingSchematics.remove(s);
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


                            t.button(Icon.trash, Styles.clearPartiali, () => Vars.ui.showConfirm("@confirm", Core.bundle.format("scripts.schematics-pack.schematics-delete-confirm", schem.name()), () => {
                                deletedSchematics.remove(schem);
                                startingSchematics.remove(schem);
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
                                print(e);
                                t.image(Core.atlas.find("error"));
                            }
                        }));

                    }), () => Vars.ui.showConfirm("@confirm", Core.bundle.format("scripts.schematics-pack.schematics-restore-confirm", schem.name()), () => {

                        deletedSchematics.remove(schem);
                        print("startingSchematics schem " + schem.name() + " " + startingSchematics.contains(schem))
                        if (!startingSchematics.contains(schem)) startingSchematics.add(schem);
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

});

Events.on(SchematicCreateEvent, e => {
    startingSchematics.add(e.schematic);
});


Events.on(DisposeEvent, e => {
    updateDeletedSchematics();
});
