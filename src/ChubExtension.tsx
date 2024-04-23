import {ReactElement} from "react";
import {Extension, ExtensionResponse, InitialData, Message} from "chub-extensions-ts";
import {LoadResponse} from "chub-extensions-ts/dist/types/load";
import CircularMaze from "./CircularMaze.tsx";

type StateType = { posX: number, posY: number, facingX: number, facingY: number };

type ConfigType = any;

export class ChubExtension implements Extension<StateType, ConfigType> {

    userLocation: { posX: number, posY: number, facingX: number, facingY: number };
    maze: any

    constructor(data: InitialData<StateType, ConfigType>) {
        const {
            characters,     // @type:  { [key: string]: Character }
            users,              // @type:  { [key: string]: User}
            config,                             //  @type:  ConfigType
            lastState                           //  @type:  StateType
        } = data;
        if(lastState != null) {
            this.userLocation = lastState;
        } else {
            this.userLocation = {posX: 0, posY: 0, facingX: 0, facingY: 1};
        }
    }

    async load(): Promise<Partial<LoadResponse>> {
        return {
            success: true,
            error: null
        };
    }

    async setState(state: StateType): Promise<void> {
        if (state != null) {
            this.userLocation = {...this.userLocation, ...state};
        }
    }

    async beforePrompt(userMessage: Message): Promise<Partial<ExtensionResponse<StateType>>> {
        const {
            content,            /*** @type: string
             @description Just the last message about to be sent. ***/
            anonymizedId,       /*** @type: string
             @description An anonymized ID that is unique to this individual
              in this chat, but NOT their Chub ID. ***/
            isBot             /*** @type: boolean
             @description Whether this is itself from another bot, ex. in a group chat. ***/
        } = userMessage;
        if(content.includes('right')) {
            this.userLocation.posX += 1;
        } else if (content.includes('left')) {
            this.userLocation.posX -= 1;
        } else if (content.includes('up')) {
            this.userLocation.posY += 1;
        } else if (content.includes('down')) {
            this.userLocation.posY -= 1;
        }
        return {
            extensionMessage: null,
            state: {...this.userLocation},
            modifiedMessage: null,
            error: null
        };
    }

    async afterResponse(botMessage: Message): Promise<Partial<ExtensionResponse<StateType>>> {
        const {
            content,            /*** @type: string
             @description The LLM's response. ***/
            anonymizedId,       /*** @type: string
             @description An anonymized ID that is unique to this individual
              in this chat, but NOT their Chub ID. ***/
            isBot             /*** @type: boolean
             @description Whether this is from a bot, conceivably always true. ***/
        } = botMessage;
        return {
            extensionMessage: null,
            state: {...this.userLocation},
            modifiedMessage: null,
            error: null
        };
    }


    render(): ReactElement {
        return  <CircularMaze userLocation={this.userLocation} rows={10} />;
    }

}
