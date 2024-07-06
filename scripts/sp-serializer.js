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
        const categoryArr = serializeCategory(cat);
        result[cat.name()] = categoryArr;
    }

    return result;
}

function serializePlanet(planet /* Fi */) {
    const result = {};
    result.name = planet.name();
    
    const categories = planet.list();
    result.categories = serializePlanetCategories(categories);

    return result;
}

function serializePlanets(planets /* Fi[] */) {
    const result = [];
    for (let p of planets) {
        if (!p.isDirectory()) continue;
        const planetObj = serializePlanet(p);
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

    return resultJson;
}



