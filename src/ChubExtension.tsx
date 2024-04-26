import {ReactElement} from "react";
import {AspectRatio, Extension, ExtensionResponse, generationService, InitialData, Message} from "chub-extensions-ts";
import {LoadResponse} from "chub-extensions-ts/dist/types/load";
import SquareMaze, {generateMaze} from "./SquareMaze.tsx";

type StateType = {userLocation: { posX: number, posY: number, facingX: number, facingY: number }, image: string,
    visited: {[key: number]: Set<number>}};

type ConfigType = { size?: number | null, imagePromptPrefix?: string | null };

export class ChubExtension implements Extension<StateType, ConfigType> {

    userLocation: { posX: number, posY: number, facingX: number, facingY: number };
    maze: any
    mazeId: string
    size: number
    imagePromptPrefix: string
    image: string
    visited: {[key: number]: Set<number>}

    constructor(data: InitialData<StateType, ConfigType>) {
        const {
            characters,     // @type:  { [key: string]: Character }
            users,              // @type:  { [key: string]: User}
            config,                             //  @type:  ConfigType
            lastState,                           //  @type:  StateType
            initState
        } = data;
        this.size = config != null && config.hasOwnProperty('size') && config.size != null ? config.size : 15;
        if(initState != null && initState.hasOwnProperty('maze') && initState.maze != null) {
            this.maze = initState.maze
            this.size = this.maze.length;
        } else {
            this.maze = generateMaze(this.size, this.size);
        }
        if(config != null && config.hasOwnProperty('imagePromptPrefix') && config.imagePromptPrefix != null) {
            this.imagePromptPrefix = config.imagePromptPrefix;
        } else {
            this.imagePromptPrefix = 'An ethereal vision of this in a fog, digital art\n';
        }
        this.mazeId = Object.keys(characters).filter(charId => characters[charId].name == 'The Maze')[0];
        if(lastState != null) {
            this.userLocation = lastState.userLocation;
            this.image = lastState.image;
            this.visited = lastState.visited;
        } else {
            const middle = Math.floor(this.size / 2);
            this.userLocation = {posX: middle, posY: middle, facingX: 0, facingY: 1};
            this.image = '';
            this.visited = {};
        }
        this.visit();
    }

    async load(): Promise<Partial<LoadResponse>> {
        return {
            success: true,
            error: null,
            initState: { maze: this.maze }
        };
    }

    async setState(state: StateType): Promise<void> {
        if (state != null) {
            this.userLocation = {...this.userLocation, ...state.userLocation};
            this.image = state.image;
        }
    }

    async beforePrompt(userMessage: Message): Promise<Partial<ExtensionResponse<StateType>>> {
        const {
            content,
            anonymizedId,
            isBot,
            promptForId
        } = userMessage;
        let moved = false;
        // Yes this is a dumb way to do this.
        if(content.includes('right')) {
            while(!this.maze[this.userLocation.posX][this.userLocation.posY].walls.right
            && (!moved || (this.maze[this.userLocation.posX][this.userLocation.posY].walls.up && this.maze[this.userLocation.posX][this.userLocation.posY].walls.down))
            && this.userLocation.posY < this.size - 1) {
                this.userLocation.posY += 1;
                moved = true;
                this.visit();
            }
        } else if (content.includes('left')) {
            while(!this.maze[this.userLocation.posX][this.userLocation.posY].walls.left
            && (!moved || (this.maze[this.userLocation.posX][this.userLocation.posY].walls.up && this.maze[this.userLocation.posX][this.userLocation.posY].walls.down))
            && this.userLocation.posY > 0) {
                this.userLocation.posY -= 1;
                moved = true;
                this.visit();
            }
        } else if (content.includes('up')) {
            while(!this.maze[this.userLocation.posX][this.userLocation.posY].walls.up
            && (!moved || (this.maze[this.userLocation.posX][this.userLocation.posY].walls.left && this.maze[this.userLocation.posX][this.userLocation.posY].walls.right))
            && this.userLocation.posX > 0) {
                this.userLocation.posX -= 1;
                moved = true;
                this.visit();
            }
        } else if (content.includes('down')) {
            while(!this.maze[this.userLocation.posX][this.userLocation.posY].walls.down
            && (!moved || (this.maze[this.userLocation.posX][this.userLocation.posY].walls.left && this.maze[this.userLocation.posX][this.userLocation.posY].walls.right))
            && this.userLocation.posX < this.size - 1) {
                this.userLocation.posX += 1;
                moved = true;
                this.visit();
            }
        }
        let modifiedMessage = null;
        let extensionMessage = null;
        if(this.won()) {
            extensionMessage = "-- Important System Note: the player(s) have reached the exit of The Maze! Game Won! --"
        }
        return {
            extensionMessage,
            state: {userLocation: {...this.userLocation}, image: this.image, visited: this.visited},
            modifiedMessage,
            error: null
        };
    }

    won() {
        return this.userLocation.posX == 0 || this.userLocation.posY == 0 || this.userLocation.posY == this.size - 1 || this.userLocation.posX == this.size - 1;
    }

    async afterResponse(botMessage: Message): Promise<Partial<ExtensionResponse<StateType>>> {
        const {
            content,
            anonymizedId,
            isBot
        } = botMessage;
        let modifiedMessage = null;
        if(anonymizedId == this.mazeId) {
            modifiedMessage = content.includes('```') ? content.substring(0, content.indexOf('```')) : content;
            generationService.makeImage({aspect_ratio: AspectRatio.SQUARE,
                negative_prompt: "", prompt: this.imagePromptPrefix + modifiedMessage,
                seed: 0}).then(image => {
                this.image = image != null ? image.url : '';
            });
            modifiedMessage += "```\nAvailable Directions:\n";
            const current = this.maze[this.userLocation.posX][this.userLocation.posY];
            let avail = [];
            if(!current.walls.up) {
                avail.push('up');
            }
            if(!current.walls.down) {
                avail.push('down');
            }
            if(!current.walls.left) {
                avail.push('left');
            }
            if(!current.walls.right) {
                avail.push('right');
            }
            modifiedMessage += `[ ${avail.join(', ')} ]`;
            modifiedMessage += "\n```";
        }
        return {
            extensionMessage: null,
            state: {userLocation: {...this.userLocation}, image: this.image, visited: this.visited},
            modifiedMessage,
            error: null
        };
    }

    visit() {
        for (let r = -1; r < 2; r++) {
            for (let c = -1; c < 2; c++) {
                this.maze[this.userLocation.posX + r][this.userLocation.posY + c].visited = true;
                if(!this.visited.hasOwnProperty(this.userLocation.posX + r)) {
                    this.visited[this.userLocation.posX + r] = new Set();
                }
                this.visited[this.userLocation.posX + r].add(this.userLocation.posY + c);
            }
        }
    }


    render(): ReactElement {
        return <>
            <SquareMaze grid={this.maze} userLocation={this.userLocation} />
            {this.image != null && this.image != '' && <img src={this.image} />}
        </>
    }

}
