import React, {useEffect, useRef} from 'react';
import {checkNeighbours, solve} from "./solver.ts";
import {MazeCell, MazeGrid, MazeWall, removeWalls, show} from "./maze.ts";

const SquareMaze = ({ grid, userLocation, quit }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        drawMaze(grid, userLocation, quit);
    }, [grid, userLocation.posX, userLocation.posY, quit]);

    return <canvas ref={canvasRef} className="maze" />;
};

export const generateMaze = (rows, columns): MazeGrid => {
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
            show(grid[r][c], size, rows, columns, inside, solution, ctx);
        }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
};


class Maze {
    public size: any;
    public columns: any;
    public rows: any;
    grid: MazeGrid;
    public stack: any[];
    public current: MazeCell;
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
                let walls: { [key in MazeWall]: boolean } = {
                    [MazeWall.up]: true,
                    [MazeWall.down]: true,
                    [MazeWall.left]: true,
                    [MazeWall.right]: true,
                };
                let cell: MazeCell = {
                    colNum: c, rowNum: r, visited: false, walls
                };
                row.push(cell);
            }
            this.grid.push(row);
        }
        this.current = this.grid[0][0];
    }

    draw() {
        this.current.visited = true;
        let next = checkNeighbours(this.grid, this.current.rowNum, this.current.colNum);
        if (next) {
            next.visited = true;
            removeWalls(this.grid[this.current.rowNum][this.current.colNum], this.grid[next.rowNum][next.colNum]);
            this.stack.push(this.current);
            this.current = next;
        } else if (this.stack.length > 0) {
            this.current = this.stack.pop();
        }

        if (this.stack.length === 0) {
            return;
        }

        this.draw();
    }
}

export default SquareMaze;
