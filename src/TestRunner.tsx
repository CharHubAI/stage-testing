import {ChubExtension} from "./ChubExtension.tsx";
import {useEffect, useState} from "react";
import {DEFAULT_INITIAL, DEFAULT_MESSAGE, Extension, ExtensionResponse, InitialData} from "chub-extensions-ts";

// Modify this JSON to include whatever character/user information you want to test.
import InitData from './assets/test-init.json';

export interface TestExtensionRunnerProps<ExtensionType extends Extension<StateType, ConfigType>, StateType, ConfigType> {
    factory: (data: InitialData<StateType, ConfigType>) => ExtensionType;
}

/***
 This is a testing class for running an extension locally when testing,
    outside the context of an active chat. See runTests() below for the main idea.
 ***/
export const TestExtensionRunner = <ExtensionType extends Extension<StateType, ConfigType>,
    StateType, ConfigType>({ factory }: TestExtensionRunnerProps<ExtensionType, StateType, ConfigType>) => {

    // You may need to add a @ts-ignore here,
    //     as the linter doesn't always like the idea of reading types arbitrarily from files
    const [extension, _setExtension] = useState(new ChubExtension({...DEFAULT_INITIAL, ...InitData}));

    // This is what forces the extension node to re-render.
    const [node, setNode] = useState(new Date());

    function refresh() {
        setNode(new Date());
    }

    async function delayedTest(test: any, delaySeconds: number) {
        await new Promise(f => setTimeout(f, delaySeconds * 1000));
        return test();
    }

    /***
     This is the main thing you'll want to modify.
     ***/
    async function runTests() {

    }

    useEffect(() => {
        // Always do this first, and put any other calls inside the load response.
        extension.load().then((res) => {
            console.info(`Test Extension Runner load success result was ${res.success}`);
            if(!res.success || res.error != null) {
                console.error(`Error from extension during load, error: ${res.error}`);
            } else {
                runTests().then(() => console.info("Done running tests."));
            }
        });
    }, []);

    return <>
        <div style={{display: 'none'}}>{String(node)}{window.location.href}</div>
        {extension == null ? <div>Extension loading...</div> : extension.render()}
    </>;
}
