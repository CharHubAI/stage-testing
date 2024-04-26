import {ReactElement} from "react";
import {AspectRatio, Extension, ExtensionResponse, generationService, InitialData, Message} from "chub-extensions-ts";
import {LoadResponse} from "chub-extensions-ts/dist/types/load";
import SquareMaze, {generateMaze} from "./SquareMaze.tsx";

type MessageStateType = {userLocation: { posX: number, posY: number, facingX: number, facingY: number }, image: string};

type ConfigType = { size?: number | null, imagePromptPrefix?: string | null };

type ChatStateType = {
    visited: {[key: number]: Set<number>}
}

type InitStateType = any;

export class ChubExtension implements Extension<InitStateType, ChatStateType, MessageStateType, ConfigType> {

    userLocation: { posX: number, posY: number, facingX: number, facingY: number };
    maze: any
    mazeId: string
    size: number
    imagePromptPrefix: string
    image: string
    visited: {[key: number]: Set<number>}
    quit: boolean

    constructor(data: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType>) {
        const {
            characters,
            users,
            config,
            messageState,
            chatState,
            initState
        } = data;
        this.quit = false;
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
            this.imagePromptPrefix = 'Highest quality, 8K, digital art\n';
        }
        this.mazeId = Object.keys(characters).filter(charId => characters[charId].name == 'The Maze')[0];
        if(messageState != null) {
            this.userLocation = messageState.userLocation;
            this.image = messageState.image;
        } else {
            const middle = Math.floor(this.size / 2);
            this.userLocation = {posX: middle, posY: middle, facingX: 0, facingY: 1};
            this.image = '';
        }
        this.visited = chatState != null ? chatState.visited : {};
        this.visit();
    }

    async load(): Promise<Partial<LoadResponse<InitStateType, ChatStateType, MessageStateType>>> {
        return {
            success: true,
            error: null,
            initState: { maze: this.maze },
            messageState: {userLocation: {...this.userLocation}, image: this.image},
            chatState: {visited: this.visited},
        };
    }

    async setState(state: MessageStateType): Promise<void> {
        if (state != null) {
            this.userLocation = {...this.userLocation, ...state.userLocation};
            this.image = state.image;
        }
    }

    async beforePrompt(userMessage: Message): Promise<Partial<ExtensionResponse<ChatStateType, MessageStateType>>> {
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
        } else if (content.includes('quit')) {
            this.quit = true;
        } else if (content.includes('retry')) {
            this.quit = false;
        }
        let modifiedMessage = null;
        let extensionMessage = null;
        if(this.won()) {
            extensionMessage = "-- Important System Note: the player(s) have reached the exit of The Maze! Game Won! --"
        } else if (this.quit) {
            extensionMessage = "-- Important System Note: the player(s) have given up and quit. The way out is now revealed to them, but they have lost forever. --";
        }
        return {
            extensionMessage,
            messageState: {userLocation: {...this.userLocation}, image: this.image},
            chatState: {visited: this.visited},
            modifiedMessage,
            error: null
        };
    }

    won() {
        return this.userLocation.posX == 0 || this.userLocation.posY == 0 || this.userLocation.posY == this.size - 1 || this.userLocation.posX == this.size - 1;
    }

    async afterResponse(botMessage: Message): Promise<Partial<ExtensionResponse<ChatStateType, MessageStateType>>> {
        const {
            content,
            anonymizedId,
            isBot
        } = botMessage;
        let modifiedMessage = null;
        let systemMessage = "```\nAvailable Directions:\n";
        if(anonymizedId == this.mazeId) {
            if(content.includes('```')) {
                modifiedMessage = content.substring(0, content.indexOf('```'));
            }

            generationService.makeImage({aspect_ratio: AspectRatio.SQUARE,
                negative_prompt: "", prompt: this.imagePromptPrefix + modifiedMessage != null ? modifiedMessage : content,
                seed: 0}).then(image => {
                this.image = image != null ? image.url : '';
            });
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
            if(!this.quit) {
                avail.push('quit');
            } else {
                avail.push('retry');
            }
            systemMessage += `[ ${avail.join(', ')} ]`;
            systemMessage += "\n```";
        }
        return {
            extensionMessage: null,
            messageState: {userLocation: {...this.userLocation}, image: this.image},
            chatState: {visited: this.visited},
            modifiedMessage,
            systemMessage,
            error: null
        };
    }

    visit() {
        for (let r = -1; r < 2; r++) {
            for (let c = -1; c < 2; c++) {
                this.maze[this.userLocation.posX + r][this.userLocation.posY + c].visited = true;
                if (!this.visited[this.userLocation.posX + r]) {
                    this.visited[this.userLocation.posX + r] = new Set();
                }
                this.visited[this.userLocation.posX + r].add(this.userLocation.posY + c);
            }
        }
    }


    render(): ReactElement {
        return <>
            <SquareMaze grid={this.maze} userLocation={this.userLocation} quit={this.quit} />
            {this.image != null && this.image != '' && <img src={this.image} />}
        </>
    }

}
