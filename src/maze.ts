export type MazeGrid = MazeCell[][];

export enum MazeWall {
    down = 'down',
    right = 'right',
    up = 'up',
    left = 'left',
}

export const SIDES: { [key in MazeWall]: MazeWall[] } = {
    [MazeWall.up]: [MazeWall.left, MazeWall.right],
    [MazeWall.down]: [MazeWall.left, MazeWall.right],
    [MazeWall.left]: [MazeWall.up, MazeWall.down],
    [MazeWall.right]: [MazeWall.up, MazeWall.down],
};

export interface MazeCell {
    walls: { [key in MazeWall]: boolean };
    colNum: number;
    rowNum: number;
    visited: boolean;
}

export function canMove(direction: MazeWall, cell: MazeCell, moved: boolean, userLocation, size) {
    if(!cell.walls[direction] && (!moved || (cell.walls[SIDES[direction][0]] && cell.walls[SIDES[direction][0]]))) {
        switch (direction) {
            case MazeWall.right:
                return userLocation.posY < size - 1;
            case MazeWall.left:
                return userLocation.posY > 0;
            case MazeWall.up:
                return userLocation.posX > 0;
            case MazeWall.down:
                return userLocation.posX < size - 1
            default:
                return false;
        }
    }
    return false;
}

export function drawWall(x, y, size, columns, rows, ctx: CanvasRenderingContext2D, side: MazeWall) {
    ctx.beginPath();
    const moveX = side == MazeWall.right ? x + size / columns : x;
    const moveY = side == MazeWall.down ? y + size / rows : y;
    ctx.moveTo(moveX, moveY);
    const lineX = side == MazeWall.left ? x : x + size / columns;
    const lineY = side == MazeWall.up ? y : y + size / rows;
    ctx.lineTo(lineX, lineY);
    ctx.stroke();
}

export function removeWalls(cell1: MazeCell, cell2: MazeCell) {
    let x = cell1.colNum - cell2.colNum;
    if (x === 1) {
        cell1.walls[MazeWall.left] = false;
        cell2.walls[MazeWall.right] = false;
    } else if (x === -1) {
        cell1.walls[MazeWall.right] = false;
        cell2.walls[MazeWall.left] = false;
    }
    let y = cell1.rowNum - cell2.rowNum;
    if (y === 1) {
        cell1.walls[MazeWall.up] = false;
        cell2.walls[MazeWall.down] = false;
    } else if (y === -1) {
        cell1.walls[MazeWall.down] = false;
        cell2.walls[MazeWall.up] = false;
    }
}

export function show(cell: MazeCell, size, rows, columns, inside, solution: Set<string> | null, ctx) {
    let x = (cell.colNum * size) / columns;
    let y = (cell.rowNum * size) / rows;
    ctx.strokeStyle = 'darkgreen';
    ctx.fillStyle = inside ? 'darkolivegreen' : 'darkolivegreen';
    const width = 2;
    ctx.lineWidth = width;
    if (cell.walls[MazeWall.up]) drawWall(x, y, size, columns, rows, ctx, MazeWall.up);
    if (cell.walls[MazeWall.right]) drawWall(x, y, size, columns, rows, ctx, MazeWall.right);
    if (cell.walls[MazeWall.down]) drawWall(x, y, size, columns, rows, ctx, MazeWall.down);
    if (cell.walls[MazeWall.left]) drawWall(x, y, size, columns, rows, ctx, MazeWall.left);
    if (cell.rowNum == 0 || cell.colNum == 0 || cell.rowNum == rows-1 || cell.colNum == columns-1) {
        ctx.fillStyle = 'green';
        ctx.fillRect(x + 1, y + 1, (size / columns) + width, (size / rows) + width);
    } else if (cell.visited || solution != null) {
        ctx.fillRect(x + 1, y + 1, (size / columns) + width,  (size / rows) + width);
    } else {
        ctx.fillStyle = 'darkgreen';
        ctx.fillRect(x + 1, y + 1, (size / columns) + width, (size / rows) + width);
    }
    if(inside) {
        ctx.fillStyle = 'indianred';
        ctx.fillRect(x + 10, y + 10, (size /columns) - 20, (size/rows) - 20);
    } else if (solution != null && solution.has(`${cell.rowNum}-${cell.colNum}`)) {
        ctx.fillStyle = 'orange';
        ctx.fillRect(x + 10, y + 10, (size /columns) - 20, (size/rows) - 20);
    }
}

export function deserializeMazeCell(obj: any): MazeCell {
    const walls: { [key in MazeWall]: boolean } = {
        [MazeWall.up]: false,
        [MazeWall.down]: false,
        [MazeWall.left]: false,
        [MazeWall.right]: false,
    };

    for (const key in obj.walls) {
        if (Object.prototype.hasOwnProperty.call(obj.walls, key)) {
            const mazeWall = MazeWall[key as keyof typeof MazeWall];
            if (mazeWall !== undefined) {
                walls[mazeWall] = obj.walls[key];
            }
        }
    }

    return {
        walls,
        colNum: obj.colNum,
        rowNum: obj.rowNum,
        visited: obj.visited,
    };
}
