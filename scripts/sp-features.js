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
