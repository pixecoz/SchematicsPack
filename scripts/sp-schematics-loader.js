
const constants = require("sp-constants");
const utils = require("sp-utils");
const { stileString } = require("./sp-utils");
const spprint = utils.spprint;


function PlanetLike(name, color) {
    this.name = String(name);
    this.color = this.iconColor = color instanceof Color ? color : Color.white.cpy();
}

const baseSchematicsLoader = {  // tru interface
    getPlanets: function() {  // -> Array[PlanetLike]
        return [];
    },
    getCategories: function(planetName) {  // -> Array[String]
        return []
    },
    getSchematics: function(planetName, categoryName) {  // -> Array[Schematic]
        return []
    }
}

const fileSchematicsLoader = {
    init: function() {
        this.planets = [
            new PlanetLike("serpulo"),
            // new PlanetLike("erekir")
        ];

        this.planetDirectories = {};
        this.planetDirectories[this.planets[0].name] = "msch";

        this.planetCategories = {};
        const mod = Vars.mods.locateMod("schematics-pack");
        for (let planetName in this.planetDirectories) {
            const subdirs = mod.root.child(this.planetDirectories[planetName]).list();
            const categories = [];
            for (let i = 0; i < subdirs.length; i++) {
                categories.push(subdirs[i].name());
            }
            this.planetCategories[planetName] = categories;
        }

        this.planetSchematicsByCategory = {};
        for (let planetName in this.planetDirectories) {
            this.planetSchematicsByCategory[planetName] = {};
            for (let i in this.planetCategories[planetName]) {
                const categoryName = this.planetCategories[planetName][i];
                const schematics = [];
                const schematicFiles = mod.root.child(this.planetDirectories[planetName]).child(categoryName).list("msch");
                for (let fi of schematicFiles) {
                    try {
                        schematics.push(Schematics.read(fi));
                        // spprint("load:", fi.path(), "for:", planetName, categoryName);
                    } catch (e) {
                        spprint("Unable read schematic from:", fi.path(), "error:", e);
                    }
                }
                this.planetSchematicsByCategory[planetName][categoryName] = schematics;
            }
        }
    },
    getPlanets: function() {  
        return this.planets;
    },
    getCategories: function(planetName) {
        return this.planetCategories[planetName] ? this.planetCategories[planetName] : [];
    },
    getSchematics: function(planetName, categoryName) {
        const schematicsByCategory = this.planetSchematicsByCategory[planetName];
        if (!schematicsByCategory) {
            return [];
        }
        return schematicsByCategory[categoryName] ? schematicsByCategory[categoryName] : [];
    }
}
fileSchematicsLoader.__proto__ = baseSchematicsLoader;  // tru inheritance
fileSchematicsLoader.init();



const githubSchematicsLoader = {
    init: function() {
        this.planets = [];
        this.planetCategories = {};
        this.planetSchematicsByCategory = {};
        getSchematicsJson((json) => {
            this.setJson(json);
            spprint("load json with", this.planets.length, "planets");
        });
    },
    setJson: function(json) {
        this.planets = json.planets;
        this.planetCategories = json.planetCategories;
        this.planetSchematicsByCategory = json.planetSchematicsByCategory;
    },
    getPlanets: function() {
        return this.planets;
    },
    getCategories: function(planetName) {
        return this.planetCategories[planetName] ? this.planetCategories[planetName] : [];
    },
    getSchematics: function(planetName, categoryName) {
        const schematicsByCategory = this.planetSchematicsByCategory[planetName];
        if (!schematicsByCategory) {
            return [];
        }
        return schematicsByCategory[categoryName] ? schematicsByCategory[categoryName] : [];
    }
}
githubSchematicsLoader.__proto__ = baseSchematicsLoader;  // tru inheritance
githubSchematicsLoader.init();



function parseSchematicsJson(schematicsJson) {
    const result = {
        planets: [],
        planetCategories: {},
        planetSchematicsByCategory: {},
    };
   
    for (let i = 0; i < schematicsJson.length; i++) {
        // if (schematicsJson[i].type !== "planet") {
        //     spprint("skip unknown type in json:", schematicsJson[i].type);
        //     continue;
        // }

        const planetName = schematicsJson[i].name;
        result.planets.push(new PlanetLike(planetName));
        result.planetCategories[planetName] = Object.keys(schematicsJson[i].categories);

        result.planetSchematicsByCategory[planetName] = {};
        for (let j in result.planetCategories[planetName]) {
            const categoryName = result.planetCategories[planetName][j];
            const schematics = [];
            const schematicsBase64 = schematicsJson[i].categories[categoryName];
            for (let base64 of schematicsBase64) {
                try {
                    schematics.push(Schematics.readBase64(base64));
                    // spprint("load:", base64, "for:", planetName, categoryName);
                } catch (e) {
                    spprint("Unable read schematic from:", base64.substring(0, 10) + "...", "error:", e);
                }
            }
            result.planetSchematicsByCategory[planetName][categoryName] = schematics;
        }
    }

    return result;
}


function getSchematicsJson(callback) {
    Http.get(constants.schematicsMetaUrl)
        .error((e) => {
            spprint("failed to fetch metadata file: " + e);
            callback(getLocalJson());
        })
        .submit((res) => {
            const stringRes = res.getResultAsString().trim();
            const jsonRes = JSON.parse(stringRes);
            const localHash = utils.strMd5str(getLocalJsonString());
            if (localHash == jsonRes.hash) {
                spprint("fetched hash equals local");
                callback(getLocalJson());
            } else {
                spprint(localHash + " != " + jsonRes.hash);
                Core.app.post(() => {
                    Http.get(constants.schematicsJsonUrl)
                    .error((e) => {
                        spprint("error fetching schematics json: " + e);
                        callback(getLocalJson());
                    })
                    .submit((res) => {
                        spprint("success fetch schematics json");
                        const stringRes = res.getResultAsString().trim();
                        const jsonRes = JSON.parse(stringRes);
                        const parsedResult = parseSchematicsJson(jsonRes);
                        saveToLocalJson(stringRes);
                        callback(parsedResult);
                    });
                });
            }
        });
    
}

function getLocalJson() {
    const localJsonFile = Vars.dataDirectory.child("sp_schematics.json");
    const json = JSON.parse(localJsonFile.readString());
    const parsedResult = parseSchematicsJson(json);
    return parsedResult;
}

function getLocalJsonString() {
    const localJsonFile = Vars.dataDirectory.child("sp_schematics.json");
    return localJsonFile.readString();
}

function saveToLocalJson(stringJson /* string */) {
    const localJsonFile = Vars.dataDirectory.child("sp_schematics.json");
    localJsonFile.writeString(stringJson);
}

module.exports = {
    fileSchematicsLoader: fileSchematicsLoader,
    githubSchematicsLoader: githubSchematicsLoader,
}
