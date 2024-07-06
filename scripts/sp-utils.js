module.exports = {
    spprint: spprint,
    stileString: stileString,
    configsEqual: configsEqual,
    tilesEqual: tilesEqual,

    getSchematicsOfCategories: getSchematicsOfCategories,
    getSchematicsOfPlanets: getSchematicsOfPlanets,
    getAllSchematics: getAllSchematics,
    addSchematicsToSave: addSchematicsToSave,
    removeSchematicsFromSave: removeSchematicsFromSave,

    strMd5str: strMd5str,
}

function spprint() {
    var text = "";
    for (var i in arguments) {
        text += String(arguments[i]) + " ";
    }
    log("schematics-pack", text);
}

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

// TODO: complete because in new versions of mindustry new kinds of config appeared 
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

function tilesEqual(schem1 /* Schematic */, schem2 /* Schematic */, sort /* bool */) {
    const tiles1 = schem1.tiles;
    const tiles2 = schem2.tiles;
    const len = tiles1.size;

    // spprint("name1="+schem1.name(), "name2="+schem2.name(),
    //     "len="+len,
    //     "tiles2.size="+tiles2.size,
    //     "schem1.width="+schem1.width,
    //     "schem2.width="+schem2.width,
    //     "schem1.height="+schem1.height,
    //     "schem2.height="+schem2.height,
    // );
    if (len != tiles2.size || schem1.width != schem2.width || schem1.height != schem2.height) return false;

    if (sort) {
        tiles1.sort(floatf(st => st.y * schem1.width + st.x));
        tiles2.sort(floatf(st => st.y * schem2.width + st.x));
    }

    var t1 = null, t2 = null;
    for (var i = 0; i < len; i++) {
        t1 = tiles1.get(i), t2 = tiles2.get(i);

        if (t1.block != t2.block || t1.x != t2.x || t1.y != t2.y ||
            t1.rotation != t2.rotation || !configsEqual(t1.config, t2.config)) {

            // spprint(schem1.name() +"!=" + schem2.name(), stileString(t1) + " != " + stileString(t2));
            return false

        }
    }
    return true;
}


function getSchematicsOfCategories(schematicLoader, planet /* string[] */, categories /* string[] */) {
    let result = [];
    for (let cat of categories) {
        result = result.concat(schematicLoader.getSchematics(planet /* string[] */, cat));
    }
    return result;
}

function getSchematicsOfPlanets(schematicLoader, planets /* string[] */) {
    let result = [];
    for (let p of planets) {
        const cats = schematicLoader.getCategories(p);
        const ofCats = getSchematicsOfCategories(schematicLoader, p, cats);
        result = result.concat(ofCats);
        // spprint("get schematics of p="+p, "cats="+cats,"ofCats="+ofCats,"result="+result);
    }
    return result;
}

function getAllSchematics(schematicLoader) {
    return getSchematicsOfPlanets(schematicLoader, schematicLoader.getPlanets());
}

function addSchematicsToSave(schematics /* Schematic[] */) {  // -> void
    const all = Vars.schematics.all();		
    all.each(cons(s => s.tiles.sort(floatf(st => st.y * s.width + st.x))));

    for (let s of schematics) {
        s.tiles.sort(floatf(st => st.y * s.width + st.x));
        const bol = !all.contains(boolf(sch => {
            const res = tilesEqual(sch, s, false);
            return res;
        }));
        if (bol) {
            Vars.schematics.add(s);
        }
    }
}

function removeSchematicsFromSave(schematics /* Schematic[] */) { // -> void
    const all = Vars.schematics.all();		
    all.each(cons(s => s.tiles.sort(floatf(st => st.y * s.width + st.x))));

    for (let s of schematics) {
        s.tiles.sort(floatf(st => st.y * s.width + st.x));
    }

    const toRemove = all.select(boolf(sch => {
        for (let s of schematics) {
            if (tilesEqual(sch, s, false)) return true; 
        }
        return false;
    }));

    for (let i = 0; i < toRemove.size; i++) {
        const s = toRemove.get(i);
        Vars.schematics.remove(s);
    }
}

function strMd5str(s /* string */) {  // -> string
    const ss = new java.lang.String(s);
    const m = java.security.MessageDigest.getInstance("MD5");
    m.update(ss.getBytes());

    return Array.from(m.digest(), (b) => {
        return ('0' + (b & 0xFF).toString(16)).slice(-2);
    }).join('');
}