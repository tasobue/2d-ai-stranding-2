import seedrandom from 'seedrandom';
import * as PF from 'pathfinding';

export enum TerrainType {
    GRASS = 0,
    WATER = 1,
    MOUNTAIN = 2,
    SAND = 3,
    FOREST = 4,
    BRIDGE = 5,
    MOUNTAIN_PASS = 6
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

    findPath(grid: TerrainType[][], startX: number, startY: number, goalX: number, goalY: number): number[][] {
        const pathGrid = new PF.Grid(this.width, this.height);
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                pathGrid.setWalkableAt(x, y, this.isWalkable(grid[y][x]));
            }
        }
        
        const finder = new PF.AStarFinder();
        return finder.findPath(startX, startY, goalX, goalY, pathGrid);
    }

    hasMultipleRoutes(grid: TerrainType[][], startX: number, startY: number, goalX: number, goalY: number): boolean {
        const path1 = this.findPath(grid, startX, startY, goalX, goalY);
        if (path1.length === 0) return false;

        const gridCopy = grid.map(row => [...row]);
        
        if (path1.length > 2) {
            const midIndex = Math.floor(path1.length / 2);
            const [blockX, blockY] = path1[midIndex];
            if (!this.isEdge(blockX, blockY)) {
                gridCopy[blockY][blockX] = TerrainType.MOUNTAIN;
                
                const path2 = this.findPath(gridCopy, startX, startY, goalX, goalY);
                return path2.length > 0;
            }
        }
        
        return false;
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
                
                if (rand < 0.4) {
                    grid[y][x] = TerrainType.GRASS;
                } else if (rand < 0.6) {
                    grid[y][x] = TerrainType.SAND;
                } else if (rand < 0.75) {
                    grid[y][x] = TerrainType.FOREST;
                } else if (rand < 0.85) {
                    grid[y][x] = TerrainType.WATER;
                } else {
                    grid[y][x] = TerrainType.MOUNTAIN;
                }
            }
        }

        this.generateComplexFeatures(grid);
        return this.ensurePathExists(grid);
    }

    private generateComplexFeatures(grid: TerrainType[][]): void {
        this.generateRivers(grid);
        this.generateMountainRanges(grid);
        this.generateForestClusters(grid);
    }

    private generateRivers(grid: TerrainType[][]): void {
        const numRivers = 1 + Math.floor(this.rng() * 2);
        
        for (let i = 0; i < numRivers; i++) {
            const startX = Math.floor(this.rng() * this.width);
            const startY = 0;
            this.createRiver(grid, startX, startY);
        }
    }

    private createRiver(grid: TerrainType[][], startX: number, startY: number): void {
        let x = startX;
        let y = startY;
        const maxLength = this.height + 5;
        
        for (let i = 0; i < maxLength && y < this.height; i++) {
            if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                grid[y][x] = TerrainType.WATER;
                
                this.placeBridges(grid, x, y);
            }
            
            y++;
            if (this.rng() < 0.3) {
                x += this.rng() < 0.5 ? -1 : 1;
                x = Math.max(0, Math.min(this.width - 1, x));
            }
        }
    }

    private placeBridges(grid: TerrainType[][], riverX: number, riverY: number): void {
        if (this.rng() < 0.15) {
            grid[riverY][riverX] = TerrainType.BRIDGE;
        }
    }

    private generateMountainRanges(grid: TerrainType[][]): void {
        const numRanges = 1 + Math.floor(this.rng() * 2);
        
        for (let i = 0; i < numRanges; i++) {
            const startX = Math.floor(this.rng() * this.width);
            const startY = Math.floor(this.rng() * this.height);
            this.createMountainRange(grid, startX, startY);
        }
    }

    private createMountainRange(grid: TerrainType[][], startX: number, startY: number): void {
        const length = 3 + Math.floor(this.rng() * 5);
        let x = startX;
        let y = startY;
        
        for (let i = 0; i < length; i++) {
            if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                grid[y][x] = TerrainType.MOUNTAIN;
                
                if (this.rng() < 0.2) {
                    grid[y][x] = TerrainType.MOUNTAIN_PASS;
                }
            }
            
            const direction = Math.floor(this.rng() * 4);
            switch (direction) {
                case 0: x++; break;
                case 1: x--; break;
                case 2: y++; break;
                case 3: y--; break;
            }
            x = Math.max(0, Math.min(this.width - 1, x));
            y = Math.max(0, Math.min(this.height - 1, y));
        }
    }

    private generateForestClusters(grid: TerrainType[][]): void {
        const numClusters = 2 + Math.floor(this.rng() * 3);
        
        for (let i = 0; i < numClusters; i++) {
            const centerX = Math.floor(this.rng() * this.width);
            const centerY = Math.floor(this.rng() * this.height);
            const radius = 2 + Math.floor(this.rng() * 3);
            
            for (let y = centerY - radius; y <= centerY + radius; y++) {
                for (let x = centerX - radius; x <= centerX + radius; x++) {
                    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                        if (distance <= radius && this.rng() < 0.7) {
                            if (grid[y][x] === TerrainType.GRASS || grid[y][x] === TerrainType.SAND) {
                                grid[y][x] = TerrainType.FOREST;
                            }
                        }
                    }
                }
            }
        }
    }

    private ensurePathExists(grid: TerrainType[][]): TerrainType[][] {
        this.ensureEdgesWalkable(grid);
        
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            const { startX, startY } = this.findStartPosition(grid);
            const { goalX, goalY } = this.findGoalPosition(grid, startX, startY);
            
            if (this.hasPath(grid, startX, startY, goalX, goalY)) {
                return grid;
            }
            
            this.createEmergencyPath(grid, startX, startY, goalX, goalY);
            attempts++;
        }
        
        return grid;
    }

    private ensureEdgesWalkable(grid: TerrainType[][]): void {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.isEdge(x, y)) {
                    if (!this.isWalkable(grid[y][x])) {
                        grid[y][x] = TerrainType.GRASS;
                    }
                }
            }
        }
    }

    private hasPath(grid: TerrainType[][], startX: number, startY: number, goalX: number, goalY: number): boolean {
        const pathGrid = new PF.Grid(this.width, this.height);
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                pathGrid.setWalkableAt(x, y, this.isWalkable(grid[y][x]));
            }
        }
        
        const finder = new PF.AStarFinder();
        const path = finder.findPath(startX, startY, goalX, goalY, pathGrid);
        
        return path.length > 0;
    }

    private createEmergencyPath(grid: TerrainType[][], startX: number, startY: number, goalX: number, goalY: number): void {
        let currentX = startX;
        let currentY = startY;
        
        while (currentX !== goalX || currentY !== goalY) {
            if (currentX < goalX) currentX++;
            else if (currentX > goalX) currentX--;
            
            if (currentY < goalY) currentY++;
            else if (currentY > goalY) currentY--;
            
            if (currentX >= 0 && currentX < this.width && currentY >= 0 && currentY < this.height) {
                if (!this.isWalkable(grid[currentY][currentX])) {
                    grid[currentY][currentX] = TerrainType.GRASS;
                }
            }
        }
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
        const config = MapGenerator.getTerrainConfig(terrain);
        return config.walkable;
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
            case TerrainType.FOREST:
                return { type, walkable: true, color: 0x27ae60, movementSpeed: 0.5 };
            case TerrainType.BRIDGE:
                return { type, walkable: true, color: 0x8b4513, movementSpeed: 0.8 };
            case TerrainType.MOUNTAIN_PASS:
                return { type, walkable: true, color: 0x7f8c8d, movementSpeed: 0.6 };
            default:
                return { type, walkable: true, color: 0x2ecc71, movementSpeed: 1.0 };
        }
    }
}