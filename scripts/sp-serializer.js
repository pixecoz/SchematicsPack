module.exports = {
    serializeDirectory: serializeDirectory,
    serializePlanets: serializePlanets,
    serializePlanet: serializePlanet,
    serializePlanetCategories: serializePlanetCategories,
    serializeCategory: serializeCategory, 
    serializeCurrentDate: serializeCurrentDate,
    serializeMeta: serializeMeta,
};

const utils = require("sp-utils");
const spprint = utils.spprint;

function serializeCurrentDate(fi /* Fi */) {
    fi.writeString(String(new Date()));
}

function serializeMeta(fi /* Fi */, resultString /* string */) {
    const meta = {
        hash: utils.strMd5str(resultString),
    }
    fi.writeString(JSON.stringify(meta, null, 4));
}

function serializeCategory(category /* Fi */) {
    const result = [];

    const schematicFiles = category.list("msch");
    for (let fi of schematicFiles) {
        let s = Vars.schematics.read(fi);
        result.push(Vars.schematics.writeBase64(s));
    }

    return result;
}

function serializePlanetCategories(categories /* Fi[] */) {
    const result = {};

    for (let cat of categories) {
        if (!cat.isDirectory()) continue;
        let categoryArr = serializeCategory(cat);
        result[cat.name()] = categoryArr;
    }

    return result;
}

function serializePlanet(planet /* Fi */) {
    const result = {};
    result.name = planet.name();
    
    const categories = planet.list();
    result.categories = serializePlanetCategories(categories);

    // spprint("name=" + result.name, "categories="+JSON.stringify(result.categories));

    return result;
}

function serializePlanets(planets /* Fi[] */) {
    const result = [];
    for (let p of planets) {
        if (!p.isDirectory()) continue;
        let planetObj = serializePlanet(p);
        // spprint("add planet obj: " + JSON.stringify(planetObj, null, 4));
        result.push(planetObj);
    }
    return result;
}

function serializeDirectory(dirName /* String */) {
    const dir = new Fi(dirName);
    
    if (!dir.exists() || !dir.isDirectory()) {
        throw new Error("directory " + dir.absolutePath() + " not exists");
    }
    
    const planets = dir.list();
    const resultJson = serializePlanets(planets);

    // spprint("output json is \n" + JSON.stringify(resultJson, null, 4));

    return resultJson;
}



