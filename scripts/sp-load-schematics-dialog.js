module.exports = {
    dialog: null,
    scrollPane: null,
}

const utils = require("sp-utils");
const schematicsLoaders = require("sp-schematics-loader");
const spprint = utils.spprint;


Events.on(EventType.ClientLoadEvent, e => {
    setupDialog(schematicsLoaders.githubSchematicsLoader);
});


function setupDialog(schematicsLoader) {
    let planetsAndAddonsSchematicsDialog = new BaseDialog("@scripts.schematics-pack.planets-and-addons-schematics-dialog");
    module.exports.dialog = planetsAndAddonsSchematicsDialog;

    setupPane(planetsAndAddonsSchematicsDialog.cont, schematicsLoader);

    planetsAndAddonsSchematicsDialog.addCloseButton();
    planetsAndAddonsSchematicsDialog.buttons.button("@scripts.schematics-pack.download-all", Icon.download, () => {/* confirm dialog */ });
}

function setupPane(table, schematicsLoader) {
    module.exports.scrollPane = table.pane(p => {
       
        const planets = schematicsLoader.getPlanets();
        for (let i = 0; i < planets.length; i++) {
            buildPlanetButtons(p, planets[i].name, schematicsLoader);
            p.row();
        }
        // buildPlanetButtons(p, "erekir");

        // icon.tint(Color.valueOf("ff9266"));
        // p.button("@planet.erekir.name", icon, () => {

        // }).size(210, 64);
        // p.button(Icon.download, () => {/* confirm dialog */ }).size(64, 64).pad(5).tooltip("@jopa");
        // p.button(Icon.trash, () => {/* confirm dialog */ }).size(64, 64).pad(5).tooltip("@jopa");

    });
}

function buildPlanetButtons(table, planetName, schematicsLoader) {
    let icon = new TextureRegionDrawable();
    icon.setRegion(Icon.planet.getRegion());
    const planet = Vars.content.planet(planetName);
    // icon.tint(Color.valueOf("7d4dff"));

    table.button(planet.localizedName, icon, () => {
        let categoriesDialog = createCategoriesDialog(planetName, schematicsLoader);
        categoriesDialog.show();
    }).size(210, 64).pad(5);

    table.button(Icon.download, () => {/* confirm dialog */ }).size(64, 64).pad(5).tooltip("@scripts.schematics-pack.download-planet-schematics-tooltip");
    table.button(Icon.trash, () => {/* confirm dialog */ }).size(64, 64).pad(5).tooltip("@scripts.schematics-pack.delete-planet-schematics-tooltip");
}

function createCategoriesDialog(planetName, schematicsLoader) {
    let categoriesDialog = new BaseDialog("@scripts.schematics-pack.planet-schematics-dialog");
    const categories = schematicsLoader.getCategories(planetName);

    for (let i = 0; i < categories.length; i++) {
        // new variable for each lambda closure because it catch i by reference that leads to same i value (=length) for each lambda running
        let ii = Number(i);
        categoriesDialog.cont.button("@scripts.schematics-pack.schematics-category-" + categories[ii], () => {
            const schematicsOfCategoryDialog = createScehmaticsDialog(planetName, categories[ii], schematicsLoader);
            schematicsOfCategoryDialog.show();
        }).size(240, 64).pad(5);
        categoriesDialog.cont.button(Icon.download, () => {/* confirm dialog */ }).size(64, 64).pad(5).tooltip("@scripts.schematics-pack.download-category-schematics-tooltip");
        categoriesDialog.cont.button(Icon.trash, () => {/* confirm dialog */ }).size(64, 64).pad(5).tooltip("@scripts.schematics-pack.delete-category-schematics-tooltip");
        categoriesDialog.cont.row();
    }

    categoriesDialog.addCloseButton();
    categoriesDialog.buttons.button("@scripts.schematics-pack.download-all", Icon.download, () => {/* confirm dialog */ });
    
    return categoriesDialog;
}

function createScehmaticsDialog(planetName, categoryName, schematicsLoader) {
    const schematicsDialog = new BaseDialog("@scripts.schematics-pack.schematics-category-" + categoryName);
    // let cols = Math.max(Core.graphics.getWidth() / Scl.scl(230), 1);
    const schematics = schematicsLoader.getSchematics(planetName, categoryName);

    for (let ss of schematics) {
        // same reason
        let s = ss;
        buildSchematicButton(schematicsDialog.cont, s);
    }

    schematicsDialog.addCloseButton();
    schematicsDialog.buttons.button("@scripts.schematics-pack.download-all", Icon.download, () => {/* confirm dialog */ });
    
    return schematicsDialog;
}

function buildSchematicButton(table, schematic) {
    let bub = table.button(cons(b => {
        b.top();
        b.margin(0);
        b.stack(new SchematicsDialog.SchematicImage(schematic).setScaling(Scaling.fit), new Table(cons(n => {
            n.top();
            n.table(Styles.black3, cons(c => {
                let label = c.add(schematic.name()).style(Styles.outlineLabel).color(Color.white).top().growX().maxWidth(200 - 8).get();
                label.setEllipsis(true);
                label.setAlignment(Align.center);
            })).growX().margin(1).pad(4).maxWidth(Scl.scl(200 - 8)).padBottom(0);
        }))).size(200);
    }), Styles.flati, run(() => {
        if (bub.childrenPressed() || !Vars.state.isMenu()) return;

        const schematicInfo = createSchematicInfoDialog(schematic);
        schematicInfo.show();

    })).pad(4).get();

    bub.getStyle().up = Tex.pane;
}

function createSchematicInfoDialog(schematic) {
    const info = new BaseDialog("[[" + Core.bundle.get("schematic") + "] " + schematic.name());

    info.cont.add(Core.bundle.format("schematic.info", schematic.width, schematic.height, schematic.tiles.size)).color(Color.lightGray).row();
    info.cont.table(cons(tags => { })).fillX().left().row();
    info.cont.add(new SchematicsDialog.SchematicImage(schematic)).maxSize(800);

    info.cont.table(cons(t => {
        t.margin(30).add("@editor.description").padRight(6).row();
        const descField = t.area(schematic.description(), Styles.areaField, t => { }).size(300, 140).left();
        descField.get().setDisabled(true);
    }));

    info.cont.row();

    const arr = schematic.requirements().toSeq();
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

    let consume = schematic.powerConsumption() * 60;
    let product = schematic.powerProduction() * 60;
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
    info.buttons.button("@editor.export", Icon.upload, () => Vars.ui.schematics.showExport(schematic));
    info.buttons.button("@scripts.schematics-pack.download-all", Icon.download, () => { });  // TODO не all может?
    // info.addCloseButton();

    return info;
}