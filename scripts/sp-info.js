const version = 1.0625;
var prevVersion = -1.0;
var versionUpgraded
const settingsKey = "scheme-pack-v";
// var allowPutNewVersion = true;
var versionUpgraded = true;
const alwaysLoad = false;
const _modname = "schematics-pack";
const folder = "msch";
const discrodURL = "https://discord.gg/P8zbP8xN8D";
const spriteName = "schematics-pack";
const githubURL = "https://github.com/pixecoz/MindustrySchematics/releases"

const startingSchematics = new Seq();
const deletedSchematics = new Seq();
const delSchemDir = Vars.dataDirectory.child("deleted_schematics");

const utils = require("sp-utils");
const spprint = utils.spprint;

const loadSchematicsDialog = require("sp-load-schematics-dialog");

loadMod();

function loadMod() {
    if (!delSchemDir.exists()) {
        delSchemDir.mkdirs();
    }

    checkVersion();

    rainbowModname();

    // overrideSchematics();
    
    const loadedAmount = loadDeletedSchematics();
    spprint("loaded " + loadedAmount + " deleted schematics");
    
    
    Events.on(EventType.ClientLoadEvent, e => {
        // loadSchematicsIfNeeded();
        startingSchematics.addAll(Vars.schematics.all());
        setupUI();
    });

    Events.on(SchematicCreateEvent, e => {
        startingSchematics.add(e.schematic);
    });


    Events.on(DisposeEvent, e => {
        updateDeletedSchematics();
        // spprint("on dispose allowPutNewVersion =", allowPutNewVersion, " putting version: ", version)
        // if (allowPutNewVersion) {
        //     Core.settings.put(settingsKey, new java.lang.Float(version));
        // }
    });

    
}

function checkVersion() {
    if (Core.settings.has(settingsKey)) {
        prevVersion = Core.settings.getFloat(settingsKey, -1.0);
        versionUpgraded = prevVersion < version;
        spprint("Settings contains settingsKey: '" + settingsKey + "', previous version: " + prevVersion + ", current version: " + version + ", version upgraded: " + versionUpgraded);
    } else {
        spprint("Settings do not contains settingsKey: '" + settingsKey + "', put current version: " + version);
        Core.settings.put(settingsKey, new java.lang.Float(version));
    }
}

function loadSchematicsIfNeeded() {
    if (versionUpgraded || alwaysLoad) {
        var amount = loadSchematics();
        spprint("Schematics loaded automatically");
        spprint("total mod schematic files: " + amount.total + "   added schematics: " + amount.added);
    }
}

function rainbowModname() {
    Events.run(EventType.Trigger.update, () => {
        let modName = "Schematics Pack";
        let newName = "";
        let hue = Time.time;
        Tmp.c1.set(Color.blue);
        for (let i in modName) {
            Tmp.c1.hue(hue);
            newName += "[#" + Tmp.c1 + "]" + modName[i] + "[]";
            hue += 10;
        }
        Vars.mods.locateMod("schematics-pack").meta.displayName = newName;
    });
}


function setupUI() {
    if (versionUpgraded) {
        // setupStartingDialog();
    }
    setupInformationDialog();
    setupDeletedSchematicsDialog();
}

function setupStartingDialog() {
    var startingDialog = new BaseDialog("@scripts.schematics-pack.starting-dialog");

    startingDialog.buttons.defaults().size(210, 64);
    startingDialog.buttons.button("@ok", () => {
        startingDialog.hide();
        
        // deleteOldSchematics();
        // Core.settings.put(settingsKey, new java.lang.Float(version));
        // allowPutNewVersion = true;
    }).size(210, 64);

    startingDialog.addCloseListener();

    startingDialog.cont.table(cons(t => {
        t.top();
        const width = Core.graphics.getWidth() * Scl.scl(1) / 5;
        t.image(Core.atlas.find(_modname + "-" + spriteName)).size(width > 480 ? 480 : width, (width > 480 ? 480 : width) / 2.76).growX();
    })).row();

    startingDialog.cont.pane(cons(t => {
        t.labelWrap("@scripts.schematics-pack.starting-dialog-text").width(Core.graphics.isPortrait() ? 400 : 700).align(Align.center);
    })).width(Core.graphics.isPortrait() ? 400 : 700).align(Align.center);

    startingDialog.show();
}

function setupInformationDialog() {
    Vars.ui.schematics.buttons.row();

    Vars.ui.schematics.buttons.button("@scripts.schematics-pack.information", Icon.info, () => {
        var information = new BaseDialog("@scripts.schematics-pack.information");

        const builder = run(() => {
            information.cont.clear();
            information.buttons.clear();

            information.cont.table(cons(t => {
                t.top();
                const width = Core.graphics.getWidth() * Scl.scl(1) / 5;
                t.image(Core.atlas.find(_modname + "-" + spriteName)).size(width > 480 ? 480 : width, (width > 480 ? 480 : width) / 2.76).growX();
            })).row();
            // information.cont.table(cons(t => t.labelWrap("@scripts.schematics-pack.mod-information").growX())).width(500).row();
            information.cont.pane(cons(t => {
                t.labelWrap("@scripts.schematics-pack.mod-information").width(Core.graphics.isPortrait() ? 400 : 700).align(Align.center);
            })).width(Core.graphics.isPortrait() ? 400 : 700).align(Align.center);
            //information.cont.labelWrap("@scripts.schematics-pack.mod-information").width(Core.graphics.isPortrait() ? 400 : 700).align(Align.center);
            information.addCloseButton();

            information.buttons.button("@scripts.schematics-pack.discord", Icon.discord, () => {
                if (!Core.app.openURI(discrodURL)) {
                    Vars.ui.showErrorMessage("@linkfail");
                }
            });

            if (Core.graphics.isPortrait()) information.buttons.row();

            information.buttons.button("@scripts.schematics-pack.load-schematics", Icon.download, () => 
            {
                // Vars.ui.showConfirm("@confirm", "@scripts.schematics-pack.schematics-confirm", () => {
                //     var amount = loadSchematics();
                //     spprint("Schematics loaded by player");
                //     spprint("total schematics files: " + amount.total + "   added schematics: " + amount.added);
                // });
                
                loadSchematicsDialog.dialog.show();
            });

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
            if (information.isShown() && Core.scene.getDialog() == information) {
                builder.run();
                information.updateScrollFocus();
            }
        });
    });
}

function setupDeletedSchematicsDialog() {
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


                            t.button(Icon.trash, Styles.squareTogglei, () => Vars.ui.showConfirm("@confirm", Core.bundle.format("scripts.schematics-pack.schematics-delete-confirm", schem.name()), () => {
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
                                spprint(e);
                                t.image(Core.atlas.find("error"));
                            }
                        }));

                    }), () => Vars.ui.showConfirm("@confirm", Core.bundle.format("scripts.schematics-pack.schematics-restore-confirm", schem.name()), () => {

                        deletedSchematics.remove(schem);
                        spprint("startingSchematics schem " + schem.name() + " " + startingSchematics.contains(schem))
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

                if (!all.contains(boolf(sch => utils.tilesEqual(sch, s, false)))) {
                    Vars.schematics.add(s);
                    added++;
                }

            } catch (e) {
                spprint("failed to copy schematic: " + e);
            }

        }
    }
    return { total: total, added: added };
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
            spprint("failed to load deleted schematic: " + e);
        }
    }

    return count;
}

function updateDeletedSchematics() {
    startingSchematics.each(sch => {
        // spprint("processed schematic '" + sch.name() + "'");
        // spprint("all: " 

        if (!Vars.schematics.all().contains(sch) && !deletedSchematics.contains(sch)) {
            try {
                const file = delSchemDir.child(Time.millis() + "." + Vars.schematicExtension);
                Vars.schematics.write(sch, file);
                sch.file = file;

                deletedSchematics.add(sch);
            } catch (e) {
                spprint(e);
            }
        }

    });
}

function overrideSchematics() {
    Events.on(EventType.ClientLoadEvent, e => {
        spprint("SCHEMATICS WAS", Vars.schematics);
        Vars.schematics = extend(Schematics, {
            read: /*Schematic*/ function (/*InputStream*/ input) /* throws IOException */ {
                for (let b of Schematics.header) {
                    if (input.read() != b) {
                        throw new java.io.IOException("Not a schematic file (missing header).");
                    }
                }

                let /*int*/ ver = input.read();

                let stream = new DataInputStream(new InflaterInputStream(input));
                let mainThrowable = null;

                try {
                    // short width = stream.readShort(), height = stream.readShort();
                    let width = stream.readShort(), height = stream.readShort();

                    // if(width > 128 || height > 128) throw new IOException("Invalid schematic: Too large (max possible size is 128x128)");

                    let map = new StringMap();
                    // int tags = stream.readUnsignedByte();
                    let tags = stream.readUnsignedByte();
                    for (let i = 0; i < tags; i++) {
                        map.put(stream.readUTF(), stream.readUTF());
                    }

                    // String[] labels = null;
                    let labels = null;

                    //try to read the categories, but skip if it fails
                    try {
                        labels = JsonIO.read(Class.forName("java.lang.String").arrayType().class, map.get("labels", "[]"));
                    } catch (/*Exception*/ ignored) {
                    }

                    // IntMap<Block> blocks = new IntMap<>();
                    let blocks = new IntMap();
                    // byte length = stream.readByte();
                    let length = stream.readByte();
                    for (let i = 0; i < length; i++) {
                        // String name = stream.readUTF();
                        let name = stream.readUTF();
                        // Block block = Vars.content.getByName(ContentType.block, SaveFileReader.fallback.get(name, name));
                        let block = Vars.content.getByName(ContentType.block, SaveFileReader.fallback.get(name, name));
                        // blocks.put(i, block == null || block instanceof LegacyBlock ? Blocks.air : block);
                        blocks.put(i, block == null || block instanceof LegacyBlock ? Blocks.air : block);
                    }

                    // int total = stream.readInt();
                    let total = stream.readInt();

                    // if(total > 128 * 128) throw new IOException("Invalid schematic: Too many blocks.");

                    // Seq<Stile> tiles = new Seq<>(total);
                    let tiles = new Seq(total);
                    for (let i = 0; i < total; i++) {
                        // Block block = blocks.get(stream.readByte());
                        let block = blocks.get(stream.readByte());
                        // int position = stream.readInt();
                        let position = stream.readInt();
                        // Object config = ver == 0 ? mapConfig(block, stream.readInt(), position) : TypeIO.readObject(Reads.get(stream));
                        let config = ver == 0 ? mapConfig(block, stream.readInt(), position) : TypeIO.readObject(Reads.get(stream));
                        // byte rotation = stream.readByte();
                        let rotation = stream.readByte();
                        if (block != Blocks.air) {
                            tiles.add(new Stile(block, Point2.x(position), Point2.y(position), config, rotation));
                        }
                    }

                    // Schematic out = new Schematic(tiles, map, width, height);
                    let out = new Schematic(tiles, map, width, height);
                    if (labels != null) out.labels.addAll(labels);
                    return out;

                } catch (/*Throwable*/ t) {
                    mainThrowable = t;
                    throw t;
                } finally {
                    if (mainThrowable == null) {
                        stream.close();
                    } else {
                        try {
                            stream.close();
                        } catch (/*Throwable*/ t) {
                            mainThrowable.addSuppressed(t)
                        }
                    }
                }


            }
        });
        spprint("SCHEMATICS BECOME", Vars.schematics);

    });
}

function deleteOldSchematics() {
    const all = Vars.schematics.all();
    const toRemove = new Seq();
    for (let i = 0; i < all.size; i++) {
        let s = all.get(i);
        if (s.name().includes("[#ffa77a99]")) {
            toRemove.add(s);
        }
    }
    
    for (let i = 0; i < toRemove.size; i++) {
        let s = toRemove.get(i);
        spprint("delete old mod schematic: [" + s.name() + "] [" + s.description() + "]");
        startingSchematics.remove(s);
        Vars.schematics.remove(s);
    }

    spprint("deleted total", toRemove.size, "old mod schematics")
}