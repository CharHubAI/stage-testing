import {MazeCell, MazeGrid, MazeWall} from "./maze.ts";

export function checkNeighbours(grid: MazeGrid, rowNum, colNum, visited=null) {
    let row = rowNum;
    let col = colNum;
    let neighbours = [];

    let top: MazeCell | undefined = row !== 0 ? grid[row - 1][col] : undefined;
    let right: MazeCell | undefined = col !== grid.length - 1 ? grid[row][col + 1] : undefined;
    let bottom: MazeCell | undefined = row !== grid.length - 1 ? grid[row + 1][col] : undefined;
    let left: MazeCell | undefined = col !== 0 ? grid[row][col - 1] : undefined;

    if (top && ((visited == null && !top.visited) || (visited != null && !visited[top.rowNum][top.colNum] && !top.walls[MazeWall.down]))) neighbours.push(top);
    if (right && ((visited == null && !right.visited) || (visited != null && !visited[right.rowNum][right.colNum] && !right.walls[MazeWall.left]))) neighbours.push(right);
    if (bottom && ((visited == null && !bottom.visited) || (visited != null && !visited[bottom.rowNum][bottom.colNum] && !bottom.walls[MazeWall.up]))) neighbours.push(bottom);
    if (left && ((visited == null && !left.visited) || (visited != null && !visited[left.rowNum][left.colNum] && !left.walls[MazeWall.right]))) neighbours.push(left);

    if (neighbours.length !== 0) {
        let random = Math.floor(Math.random() * neighbours.length);
        return neighbours[random];
    } else {
        return undefined;
    }
}

export function solve(
    maze: MazeGrid,
    startX = 0,
    startY = 0,
): Set<string> {
    const visited = {};
    // Mark all cells as unvisited:
    for (let x = 0; x < maze.length; x++) {
        visited[x] = [];
        for (let y = 0; y < maze[x].length; y++) {
            visited[x][y] = false;
        }
    }

    const solution = [];
    let currentX = startX;
    let currentY = startY;
    let option: MazeCell | null = null;

    while (currentX !== 0 && currentX !== maze.length - 1 && currentY !== 0 && currentY !== maze.length - 1) {
        visited[currentX][currentY] = true;
        option = checkNeighbours(maze, currentX, currentY, visited);

        if (option == null) {
            const [newX, newY] = solution.pop();
            currentX = newX;
            currentY = newY;
        } else {
            solution.push([currentX, currentY]);
            const [newX, newY] = [option.rowNum, option.colNum];
            currentX = newX;
            currentY = newY;
        }
    }

    solution.push([currentX, currentY]);

    return new Set(solution.map(item => `${item[0]}-${item[1]}`));
}

export function deserializeVisited(obj: any): { [key: number]: Set<number> } {
    const visited: { [key: number]: Set<number> } = {};

    for (const key in obj.visited) {
        if (Object.prototype.hasOwnProperty.call(obj.visited, key)) {
            const keyNumber = parseInt(key, 10);
            const value = obj.visited[key];

            if (value instanceof Set) {
                visited[keyNumber] = value as Set<number>;
            } else {
                visited[keyNumber] = new Set();
            }
        }
    }

    return visited;
}
