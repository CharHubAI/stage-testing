import React, { useEffect, useRef } from 'react';
import {checkNeighbours, solve} from "./solver.ts";

const SquareMaze = ({ grid, userLocation, quit }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        drawMaze(grid, userLocation, quit);
    }, [grid, userLocation.posX, userLocation.posY, quit]);

    return <canvas ref={canvasRef} className="maze" />;
};

export const generateMaze = (rows, columns) => {
    const maze = new Maze(rows, columns);
    maze.setup();
    maze.draw();

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            maze.grid[r][c].visited = false;
        }
    }
    return maze.grid;
};

const drawMaze = (grid, userLocation, quit: boolean) => {
    const canvas: HTMLCanvasElement = document.querySelector('.maze');
    const ctx = canvas.getContext('2d');
    const size = 500;
    let zoomScale = 1.5;
    const scaledSize = size ;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = scaledSize;
    canvas.height = scaledSize;
    canvas.style.background = 'black';

    const rows = grid.length;
    const columns = grid[0].length;

    const cellSize = size / rows;

    // Calculate the translation offset to center the user's location
    const offsetX = (scaledSize - size) / 2 - (userLocation.posY * cellSize * zoomScale - size / 2) - cellSize/2;
    const offsetY = (scaledSize - size) / 2 - (userLocation.posX * cellSize * zoomScale - size / 2) - cellSize/2;
    let solution = null;
    if(!quit) {
        ctx.translate(offsetX, offsetY);
        ctx.scale(zoomScale, zoomScale);
    } else {
        solution = solve(grid, userLocation.posX, userLocation.posY);
    }

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            const inside = r === userLocation.posX && c === userLocation.posY;
            grid[r][c].show(size, rows, columns, inside, solution);
        }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
};


class Maze {
    public size: any;
    public columns: any;
    public rows: any;
    grid: any[];
    public stack: any[];
    public current: any;
    constructor(rows, columns) {
        this.size = 500;
        this.columns = columns;
        this.rows = rows;
        this.grid = [];
        this.stack = [];
    }

    setup() {
        for (let r = 0; r < this.rows; r++) {
            let row = [];
            for (let c = 0; c < this.columns; c++) {
                let cell = new Cell(r, c);
                row.push(cell);
            }
            this.grid.push(row);
        }
        this.current = this.grid[0][0];
        this.grid[this.rows - 1][this.columns - 1].goal = true;
    }

    draw() {
        this.current.visited = true;
        let next = checkNeighbours(this.grid, this.current.rowNum, this.current.colNum);
        if (next) {
            next.visited = true;
            this.grid[this.current.rowNum][this.current.colNum].removeWalls(this.grid[this.current.rowNum][this.current.colNum], this.grid[next.rowNum][next.colNum]);
            this.stack.push(this.current);
            this.current = next;
        } else if (this.stack.length > 0) {
            let cell = this.stack.pop();
            this.current = cell;
        }

        if (this.stack.length === 0) {
            return;
        }

        this.draw();
    }
}

class Cell {
    public walls: { down: boolean; right: boolean; up: boolean; left: boolean };
    public colNum: any;
    public visited: boolean;
    public rowNum: any;
    public goal: boolean;

    constructor(rowNum, colNum) {
        this.rowNum = rowNum;
        this.colNum = colNum;
        this.visited = false;
        this.walls = {
            up: true,
            right: true,
            down: true,
            left: true,
        };
        this.goal = false;
    }

    drawTopWall(x, y, size, columns, rows) {
        const canvas: HTMLCanvasElement = document.querySelector('.maze');
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + size / columns, y);
        ctx.stroke();
    }

    drawRightWall(x, y, size, columns, rows) {
        const canvas: HTMLCanvasElement = document.querySelector('.maze');
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x + size / columns, y);
        ctx.lineTo(x + size / columns, y + size / rows);
        ctx.stroke();
    }

    drawBottomWall(x, y, size, columns, rows) {
        const canvas: HTMLCanvasElement = document.querySelector('.maze');
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y + size / rows);
        ctx.lineTo(x + size / columns, y + size / rows);
        ctx.stroke();
    }

    drawLeftWall(x, y, size, columns, rows) {
        const canvas: HTMLCanvasElement = document.querySelector('.maze');
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + size / rows);
        ctx.stroke();
    }

    removeWalls(cell1, cell2) {
        // compares to two cells on x axis
        let x = cell1.colNum - cell2.colNum;
        // Removes the relevant walls if there is a different on x axis
        if (x === 1) {
            cell1.walls.left = false;
            cell2.walls.right = false;
        } else if (x === -1) {
            cell1.walls.right = false;
            cell2.walls.left = false;
        }
        // compares to two cells on x axis
        let y = cell1.rowNum - cell2.rowNum;
        // Removes the relevant walls if there is a different on x axis
        if (y === 1) {
            cell1.walls.up = false;
            cell2.walls.down = false;
        } else if (y === -1) {
            cell1.walls.down = false;
            cell2.walls.up = false;
        }
    }

    show(size, rows, columns, inside, solution: Set<string> | null) {
        const canvas: HTMLCanvasElement = document.querySelector('.maze');
        const ctx = canvas.getContext('2d');
        let x = (this.colNum * size) / columns;
        let y = (this.rowNum * size) / rows;
        ctx.strokeStyle = 'darkgreen';
        ctx.fillStyle = inside ? 'darkolivegreen' : 'darkolivegreen';
        const width = 2;
        ctx.lineWidth = width;
        if (this.walls.up) this.drawTopWall(x, y, size, columns, rows);
        if (this.walls.right) this.drawRightWall(x, y, size, columns, rows);
        if (this.walls.down) this.drawBottomWall(x, y, size, columns, rows);
        if (this.walls.left) this.drawLeftWall(x, y, size, columns, rows);
        if (this.visited || solution != null) {
            ctx.fillRect(x + 1, y + 1, (size / columns) + width,  (size / rows) + width);
        } else if (this.goal || this.rowNum == 0 || this.colNum == 0 || this.rowNum == rows-1 || this.colNum == columns-1) {
            ctx.fillStyle = 'green';
            ctx.fillRect(x + 1, y + 1, (size / columns) + width, (size / rows) + width);
        } else {
            ctx.fillStyle = 'darkgreen';
            ctx.fillRect(x + 1, y + 1, (size / columns) + width, (size / rows) + width);
        }
        if(inside) {
            ctx.fillStyle = 'indianred';
            ctx.fillRect(x + 10, y + 10, (size /columns) - 20, (size/rows) - 20);
        } else if (solution != null && solution.has(`${this.rowNum}-${this.colNum}`)) {
            ctx.fillStyle = 'orange';
            ctx.fillRect(x + 10, y + 10, (size /columns) - 20, (size/rows) - 20);
        }
    }
}

export default SquareMaze;
