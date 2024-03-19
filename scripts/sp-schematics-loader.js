
const utils = require("sp-utils");
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
        const urlPrefix = "https://raw.githubusercontent.com/pixecoz/SchematicsPack/dev";
        const schematicJsonPath = "/msch/sch.json";
        this.planets = [];
        this.planetCategories = {};
        this.planetSchematicsByCategory = {};

        Http.get(urlPrefix + schematicJsonPath, (res) => {
            const stringRes = res.getResultAsString().trim();
            if (stringRes == "") {
                spprint("fetched json is empty", res.getStatus(), res);
                return;
            }
            const schematicsJson = JSON.parse(stringRes);
            const parseResult = parseSchematicsJson(schematicsJson);
            this.planets = parseResult.planets;
            this.planetCategories = parseResult.planetCategories;
            this.planetSchematicsByCategory = parseResult.planetSchematicsByCategory;

            spprint("fetch json with", this.planets.length, "planets");
        });
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
        if (schematicsJson[i].type !== "planet") {
            spprint("skip unknown type in json:", schematicsJson[i].type);
            continue;
        }

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


module.exports = {
    baseSchematicsLoader: baseSchematicsLoader,
    fileSchematicsLoader: fileSchematicsLoader,
    githubSchematicsLoader: githubSchematicsLoader,
}
