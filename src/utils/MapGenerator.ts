import seedrandom from 'seedrandom';

export enum TerrainType {
    GRASS = 0,
    WATER = 1,
    MOUNTAIN = 2,
    SAND = 3
}

export interface TerrainConfig {
    type: TerrainType;
    walkable: boolean;
    color: number;
    movementSpeed: number;
}

export interface MapData {
    grid: TerrainType[][];
    width: number;
    height: number;
    startX: number;
    startY: number;
    goalX: number;
    goalY: number;
    seed: string;
}

export class MapGenerator {
    private rng: seedrandom.PRNG;
    private width: number;
    private height: number;

    constructor(width: number = 16, height: number = 16) {
        this.width = width;
        this.height = height;
        this.rng = seedrandom();
    }

    generateMap(seed?: string): MapData {
        const mapSeed = seed || this.generateSeed();
        this.rng = seedrandom(mapSeed);

        const grid = this.generateTerrain();
        const { startX, startY } = this.findStartPosition(grid);
        const { goalX, goalY } = this.findGoalPosition(grid, startX, startY);

        return {
            grid,
            width: this.width,
            height: this.height,
            startX,
            startY,
            goalX,
            goalY,
            seed: mapSeed
        };
    }

    private generateSeed(): string {
        return Math.random().toString(36).substring(2, 15);
    }

    private generateTerrain(): TerrainType[][] {
        const grid: TerrainType[][] = [];

        for (let y = 0; y < this.height; y++) {
            grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                const rand = this.rng();
                
                if (rand < 0.6) {
                    grid[y][x] = TerrainType.GRASS;
                } else if (rand < 0.75) {
                    grid[y][x] = TerrainType.SAND;
                } else if (rand < 0.9) {
                    grid[y][x] = TerrainType.WATER;
                } else {
                    grid[y][x] = TerrainType.MOUNTAIN;
                }
            }
        }

        return this.ensureWalkablePath(grid);
    }

    private ensureWalkablePath(grid: TerrainType[][]): TerrainType[][] {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.isEdge(x, y)) {
                    if (!this.isWalkable(grid[y][x])) {
                        grid[y][x] = TerrainType.GRASS;
                    }
                }
            }
        }
        return grid;
    }

    private isEdge(x: number, y: number): boolean {
        return x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1;
    }

    private findStartPosition(grid: TerrainType[][]): { startX: number; startY: number } {
        const edgePositions: { x: number; y: number }[] = [];

        for (let x = 0; x < this.width; x++) {
            if (this.isWalkable(grid[0][x])) edgePositions.push({ x, y: 0 });
            if (this.isWalkable(grid[this.height - 1][x])) edgePositions.push({ x, y: this.height - 1 });
        }
        for (let y = 1; y < this.height - 1; y++) {
            if (this.isWalkable(grid[y][0])) edgePositions.push({ x: 0, y });
            if (this.isWalkable(grid[y][this.width - 1])) edgePositions.push({ x: this.width - 1, y });
        }

        const randomIndex = Math.floor(this.rng() * edgePositions.length);
        const position = edgePositions[randomIndex];
        return { startX: position.x, startY: position.y };
    }

    private findGoalPosition(grid: TerrainType[][], startX: number, startY: number): { goalX: number; goalY: number } {
        let maxDistance = 0;
        let goalX = startX;
        let goalY = startY;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.isWalkable(grid[y][x])) {
                    const distance = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
                    if (distance > maxDistance) {
                        maxDistance = distance;
                        goalX = x;
                        goalY = y;
                    }
                }
            }
        }

        return { goalX, goalY };
    }

    private isWalkable(terrain: TerrainType): boolean {
        return terrain === TerrainType.GRASS || terrain === TerrainType.SAND;
    }

    static getTerrainConfig(type: TerrainType): TerrainConfig {
        switch (type) {
            case TerrainType.GRASS:
                return { type, walkable: true, color: 0x2ecc71, movementSpeed: 1.0 };
            case TerrainType.SAND:
                return { type, walkable: true, color: 0xf39c12, movementSpeed: 0.7 };
            case TerrainType.WATER:
                return { type, walkable: false, color: 0x3498db, movementSpeed: 0 };
            case TerrainType.MOUNTAIN:
                return { type, walkable: false, color: 0x95a5a6, movementSpeed: 0 };
            default:
                return { type, walkable: true, color: 0x2ecc71, movementSpeed: 1.0 };
        }
    }
}