
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
        Http.get(urlPrefix + schematicJsonPath, (res) => {
            const stringRes = res.getResultAsString();
            spprint("string result:", stringRes);
            const schematicsJson = JSON.parse(stringRes);
            spprint("json: ", schematicsJson);
            spprint("json[0]: ", schematicsJson[0]);

            this.planets = [];
            this.planetCategories = {};
            this.planetSchematicsByCategory = {};
            const mod = Vars.mods.locateMod("schematics-pack");

            for (let i = 0; i < schematicsJson.length; i++) {
                if (schematicsJson[i].type !== "planet") {
                    spprint("skip unknown type in json:", schematicsJson[i].type);
                    continue;
                }

                const planetName = schematicsJson[i].name;
                this.planets.push(new PlanetLike(planetName));
                this.planetCategories[planetName] = Object.keys(schematicsJson[i].categories);

                this.planetSchematicsByCategory[planetName] = {};
                for (let j in this.planetCategories[planetName]) {
                    const categoryName = this.planetCategories[planetName][j];
                    const schematics = [];
                    const schematicsBase64 = schematicsJson[i].categories[categoryName];
                    for (let base64 of schematicsBase64) {
                        try {
                            schematics.push(Schematics.readBase64(base64));
                            spprint("load:", base64, "for:", planetName, categoryName);
                        } catch (e) {
                            spprint("Unable read schematic from:", base64.substring(0, 10) + "...", "error:", e);
                        }
                    }
                    this.planetSchematicsByCategory[planetName][categoryName] = schematics;
                }
            }
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




module.exports = {
    baseSchematicsLoader: baseSchematicsLoader,
    fileSchematicsLoader: fileSchematicsLoader,
    githubSchematicsLoader: githubSchematicsLoader,
}
