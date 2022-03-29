// id from Tiled is always unique so create key from this data
const createKey = (name: string, id: number) => {
    return `${name}-${id}`;
}

// helper class to hand obstacles from Tiles and create with MattJS
// creates keys for obstacles so player knows how to handle different collision types
export default class ObstaclesController {
    private obstacles = new Map<string, MatterJS.BodyType>();

    add(name: string, body: MatterJS.BodyType) {
        const key = createKey(name, body.id);
        if (this.obstacles.has(key)) {
            throw new Error('obstacle already exits at this key');
        }
        this.obstacles.set(key, body);
    }

    isType(name: string, body: MatterJS.BodyType) {
        const key = createKey(name, body.id);
        if (!this.obstacles.has(key)) {
            return false;
        }
        return true;
    }
}