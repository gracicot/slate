# Android Mutation Manager

This project is a proof of concept for a new way to listen for mutation observer for the Android support in SlateJS. We are using the mutation observer to provide that support.

## Implementation Status

This has not been integrated in Slate as a plugin. This is a proof of concept and some use cases are not supported or just crashes.

Right now, there are two editors in the page: A native, vanilla content editable and a Slate editor. Since the integration into Slate hasn't been done yet, we only care about generating the right commands to the Slate Editor.

## Health

We will continue developping the issue for a while, but the future is still uncertain.

## How It Works

In short, we treat mutations one by one to generate Slate commands in order to mimic the evolution of the contenteditable into the Slate editor. This approach is important for a reliable model for mutation processing in Slate. When composition starts, the android keyboard has complete control over the DOM, and the model should be able to process arbitrary mutation before the composition ends. In that time, multiple line breaks, many text nodes added or deleted and more can happen in one `flush` call. This is why the new model must follow mutations in the most generic and reliable way possible.

### ModelEditor

The `ModelEditor` function is a React component that registers the mutation observer. It also registers the `selectionchange` event handler.

This component renders the initial state and is not rendered again unless switching documents.

It also calls the `recordMutations`. This step is optional, but useful as it generates test data. The object printed in the console can be pasted into a test as a string.

### makeFlushFunction

This function returns the flush function for the mutation observer to call. It takes the `commandStream` function as a parameter.

The returned flush function is meant to receive an array of `MutationRecord`. More specifically, it takes a single batch of mutations to process. The mutation record is not meant to be contained, but to be processed immediately.

The flush function will then call the `commandStream` with an array of command. It was meant to be an array of objects formed like this: `{command: 'command name', args: [...]}`. However, we didn't want to allow the model to directly interface with the editor while trying to extract information from the mutations. Some arguments such as paths, keys and ranges are generated in the `makeSlateCommandArgs` function, which has access to the editor and not the mutation record.

### processXYZ Functions

There are three process function which are used to generate commands from raw events and mutations.

 * `processSelect`: Generates `select` from a raw selection event
 * `processCharacterData`: Generates insert and delete text mutations from `characterData` mutations
 * `processChildListByDiff`: Generates the necessary command to keep track node insertion, removal and relocation

Except for `processSelect` which doesn't use mutations, the other process functions extract the needed information by creating a virtual DOM structure and rewinding the mutation in it. Using that we can see the state of the DOM before and after a particular mutation. That way, we can stream the command correctly by using the information from that virtual DOM.

We only use the virtual DOM to see the state at a particular point in time.

### dom-simulator

That file contains every function needed to create a virtual structure from the DOM and also every function used to rewind mutations in that virtual DOM.

### Tests and replay-dom

These two go together. The tests work in two ways: By constructing objects that mocks mutation records and by manually doing mutations in jsdom with a mutation observer attached to it.

Both are useful and can test different cases.

replay-dom contains the function necessary to serialize and unserialize the mutation, and also has some routine to generate actions to be done in a DOM to replay what a keyboard such as the Android keyboard would do.

You can run the tests using `npm test`.

## How Can You Help

Please, try it out and try to fix things. We think the model can be adapted and integrated into Slate and provide decent Android support. Fork it or create a new one based on the work done here. Slate 0.50 allows for an Android plugin to be shipped separately. We encourage others to create such plugin based on the experience we gained here.
