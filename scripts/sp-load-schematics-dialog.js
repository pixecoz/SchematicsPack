module.exports = {
    dialog: null,
    scrollPane: null,
}

const utils = require("sp-utils");
const spprint = utils.spprint;


Events.on(EventType.ClientLoadEvent, e => {
    setupDialog();
});


function setupDialog() {
    let planetsAndAddonsSchematicsDialog = new BaseDialog("@scripts.schematics-pack.planets-and-addons-schematics-dialog");
    module.exports.dialog = planetsAndAddonsSchematicsDialog;

    setupPane(planetsAndAddonsSchematicsDialog.cont);

    planetsAndAddonsSchematicsDialog.addCloseButton();
    planetsAndAddonsSchematicsDialog.buttons.button("@scripts.schematics-pack.download-all", Icon.download, () => {/* confirm dialog */ });
}

function setupPane(table) {
    module.exports.scrollPane = table.pane(p => {
       
        buildPlanetButtons(p, "serpulo");
        p.row();
        // buildPlanetButtons(p, "erekir");

        // icon.tint(Color.valueOf("ff9266"));
        // p.button("@planet.erekir.name", icon, () => {

        // }).size(210, 64);
        // p.button(Icon.download, () => {/* confirm dialog */ }).size(64, 64).pad(5).tooltip("@jopa");
        // p.button(Icon.trash, () => {/* confirm dialog */ }).size(64, 64).pad(5).tooltip("@jopa");

    });
}

function buildPlanetButtons(table, planetName) {
    let icon = new TextureRegionDrawable();
    icon.setRegion(Icon.planet.getRegion());
    // icon.tint(Color.valueOf("7d4dff"));

    table.button("@planet.serpulo.name", icon, () => {
        let schematicsDialog = new BaseDialog("@scripts.schematics-pack.planet-schematics-dialog");
        // for (let i = 0; i < 15; i++) {
        //     schematicsDialog.cont.table(new TextureRegionDrawable(Core.atlas.find("circle")));
        //     if (i != 1 && (i + 1) % 4 == 0)
        //         schematicsDialog.cont.row();
        // }
        let mod = Vars.mods.locateMod("schematics-pack");
        let subdirs = mod.root.child("msch").list();

        for (let i = 0; i < subdirs.length; i++) {
            // new variable for each lambda closure because it catch i by reference that leads to same i value (=subdirs.length) for each lambda running
            let ii = Number(i);
            schematicsDialog.cont.button("@scripts.schematics-pack.schematics-category-" + subdirs[ii].name(), () => {
                let anotherSchematicsDialog = new BaseDialog("@scripts.schematics-pack.schematics-category-" + subdirs[ii].name());

                let cols = Math.max(Core.graphics.getWidth() / Scl.scl(230), 1);

                let schematics = [];

                let schematicFiles = subdirs[ii].list("msch");
                for (let fi of schematicFiles) {
                    try {
                        schematics.push(Schematics.read(fi));
                    } catch (e) {
                        spprint("Unable read schematic from:", fi.path(), "error:", e);
                    }
                }

                for (let ss of schematics) {
                    // same reason
                    let s = ss;
                    let bub = anotherSchematicsDialog.cont.button(cons(b => {
                        b.top();
                        b.margin(0);
                        // b.table(cons(buttons => {
                        //     buttons.left();
                        //     buttons.defaults().size(50);


                        //     buttons.button(Icon.info, Styles.emptyi, () => { }).tooltip("@info.title");
                        //     // buttons.button(Icon.upload, style, () -> showExport(s)).tooltip("@editor.export");
                        //     // buttons.button(Icon.pencil, style, () -> showEdit(s)).tooltip("@schematic.edit");

                        // })).growX().height(50);
                        // b.row();
                        b.stack(new SchematicsDialog.SchematicImage(s).setScaling(Scaling.fit), new Table(cons(n => {
                            n.top();
                            n.table(Styles.black3, cons(c => {
                                let label = c.add(s.name()).style(Styles.outlineLabel).color(Color.white).top().growX().maxWidth(200 - 8).get();
                                label.setEllipsis(true);
                                label.setAlignment(Align.center);
                            })).growX().margin(1).pad(4).maxWidth(Scl.scl(200 - 8)).padBottom(0);
                        }))).size(200);
                    }), Styles.flati, run(() => {
                        if (bub.childrenPressed() || !Vars.state.isMenu()) return;

                        let info = new BaseDialog("[[" + Core.bundle.get("schematic") + "] " + s.name());


                        info.cont.add(Core.bundle.format("schematic.info", s.width, s.height, s.tiles.size)).color(Color.lightGray).row();
                        info.cont.table(cons(tags => { })).fillX().left().row();
                        info.cont.add(new SchematicsDialog.SchematicImage(s)).maxSize(800);

                        info.cont.table(cons(t => {
                            t.margin(30).add("@editor.description").padRight(6).row();
                            const descField = t.area(s.description(), Styles.areaField, t => { }).size(300, 140).left();
                            descField.get().setDisabled(true);
                        }));

                        info.cont.row();

                        let arr = s.requirements().toSeq();
                        info.cont.table(cons(r => {
                            for (let i = 0; i < arr.size; i++) {
                                r.image(arr.get(i).item.uiIcon).left().size(Vars.iconMed);
                                const ii = Number(i);
                                r.label(() => "[lightgray]" + arr.get(ii).amount).padLeft(2).left().padRight(4);

                                if ((i + 1) % 4 == 1 && i != 1) {
                                    r.row();
                                }
                            }
                        }));

                        info.cont.row();

                        let consume = s.powerConsumption() * 60;
                        let product = s.powerProduction() * 60;
                        if (!Mathf.zero(consume) || !Mathf.zero(product)) {
                            info.cont.table(cons(t => {

                                if (!Mathf.zero(product)) {
                                    t.image(Icon.powerSmall).color(Pal.powerLight).padRight(3);
                                    t.add("+" + Strings.autoFixed(product, 2)).color(Pal.powerLight).left();

                                    if (!Mathf.zero(consume)) {
                                        t.add().width(15);
                                    }
                                }

                                if (!Mathf.zero(consume)) {
                                    t.image(Icon.powerSmall).color(Pal.remove).padRight(3);
                                    t.add("-" + Strings.autoFixed(consume, 2)).color(Pal.remove).left();
                                }
                            }));
                        }

                        info.buttons.clearChildren();
                        info.buttons.defaults().size(Core.graphics.isPortrait() ? 150 : 210, 64);
                        info.buttons.button("@back", Icon.left, () => info.hide());
                        info.buttons.button("@editor.export", Icon.upload, () => Vars.ui.schematics.showExport(s));
                        info.buttons.button("@scripts.schematics-pack.download-all", Icon.download, () => { });

                        // info.addCloseButton();
                        info.show();

                    })).pad(4).get();

                    bub.getStyle().up = Tex.pane;
                }


                anotherSchematicsDialog.addCloseButton();
                anotherSchematicsDialog.buttons.button("@scripts.schematics-pack.download-all", Icon.download, () => {/* confirm dialog */ });
                anotherSchematicsDialog.show();
            }).size(240, 64).pad(5);
            schematicsDialog.cont.button(Icon.download, () => {/* confirm dialog */ }).size(64, 64).pad(5).tooltip("@scripts.schematics-pack.download-category-schematics-tooltip");
            schematicsDialog.cont.button(Icon.trash, () => {/* confirm dialog */ }).size(64, 64).pad(5).tooltip("@scripts.schematics-pack.delete-category-schematics-tooltip");
            schematicsDialog.cont.row();
        }

        schematicsDialog.addCloseButton();
        schematicsDialog.buttons.button("@scripts.schematics-pack.download-all", Icon.download, () => {/* confirm dialog */ });
        schematicsDialog.show();

    }).size(210, 64).pad(5);

    table.button(Icon.download, () => {/* confirm dialog */ }).size(64, 64).pad(5).tooltip("@scripts.schematics-pack.download-planet-schematics-tooltip");
    table.button(Icon.trash, () => {/* confirm dialog */ }).size(64, 64).pad(5).tooltip("@scripts.schematics-pack.delete-planet-schematics-tooltip");
}