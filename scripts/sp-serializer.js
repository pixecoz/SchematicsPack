
function serializeCategory(category) {
    const result = [];

    const schematicFiles = category.list("msch");
    for (let fi of schematicFiles) {
        let s = Vars.schematics.read(fi);
        result.push(Vars.schematics.writeBase64(s));
    }

    return result;
}

function serializePlanetCategories(categories) {
    const result = {};

    for (let cat of categories) {
        if (!cat.isDirectory()) continue;
        const categoryArr = serializeCategory(cat);
        result[cat.name()] = categoryArr;
    }

    return result;
}

function serializePlanet(planet) {
    const result = {};
    result.type = "planet";
    result.name = planet.name();
    
    const categories = planet.list();
    result.categories = serializePlanetCategories(categories);

    return result;
}

function serializePlanets(planets) {
    const result = [];
    for (let p of planets) {
        if (!p.isDirectory()) continue;
        const planetObj = serializePlanet(p);
        result.push(planetObj);
    }
    return result;
}

function serializeDirectory(dirName) {
    const dir = new Fi(dirName);
    
    if (!dir.exists() || !dir.isDirectory()) {
        throw new Error("directory " + dir.absolutePath() + " not exists");
    }
    
    const planets = dir.list();
    const resultJson = serializePlanets(planets);

    return resultJson;
}

module.exports = {
    serializeDirectory: serializeDirectory,
    serializePlanets: serializePlanets,
    serializePlanet: serializePlanet,
    serializePlanetCategories: serializePlanetCategories,
    serializeCategory: serializeCategory, 
};


