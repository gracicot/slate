import React, {useEffect, useRef} from "react";
import documents from "./Documents";
import {processSelect, processCharacterData, processChildList } from "./process-mutations";

import { simulateDOMNodeBeforeMutations, findSimulatedNodeRecursively } from "./dom-simulator";
import { recordMutations, indexedDOM } from "./test-generator/replay-dom";

export default function ModelEditor(props = {
	initialValue: documents[0].dom,
	commandStream: () => {
	}
}) {
	const {commandStream} = props;
	
	const editable = useRef(null);
	const lastDOM = useRef(null);
	const recordContext = useRef(null);
	
	const flushFunction = makeFlushFunction(commandStream, editable);

	useEffect(() => {
		const observer = new MutationObserver((mutations) => {
			if (!editable.current) return;
		
			const placeholder = editable.current.ownerDocument.createElement('div');
			placeholder.innerHTML = lastDOM.current;
			lastDOM.current = editable.current.outerHTML;
			
			console.log(
				"testcase",
				JSON.stringify(recordMutations(editable.current, mutations, placeholder.firstElementChild, recordContext.current))
			);
			
			recordContext.current = indexedDOM(editable.current);
			
			flushFunction(mutations);
		});

		editable.current.ownerDocument.addEventListener('selectionchange', (event) => {
			if (event.currentTarget.activeElement === editable.current) {
				commandStream(processSelect(event));
			}
		});

		observer.observe(editable.current, {
			childList: true,
			characterData: true,
			attributes: true,
			subtree: true,
			characterDataOldValue: true,
		});

		editable.current.ownerDocument.execCommand('insertBrOnReturn', false, false);
		editable.current.ownerDocument.execCommand("defaultParagraphSeparator", false, "div");

		return () => {
			observer.disconnect();
		}
	});

	return (
		<div
			data-slate-editor="true"
			data-key={props.keyStart}
			ref={e => {editable.current = e; lastDOM.current = e && e.outerHTML; recordContext.current = e && indexedDOM(e)}}
			contentEditable="true" suppressContentEditableWarning
			className="line-ajust"
			autoCorrect="on"
			spellCheck="false"
			role="textbox"
			data-gramm="false"
			style={{
				outline: 'none',
				whiteSpace: 'pre-wrap',
				overflowWrap: 'break-word',
				WebkitUserModify: 'read-write-plaintext-only'
			}}
		>
			{props.initialValue}
		</div>
	);
}

export function makeFlushFunction(commandStream, editorRef) {
	const flushAction = (mutations) => {
		const commands = [];

		mutations.forEach((mutation, index) => {
			// For debugging purposes
			mutation.idx = index;
			
			const simulatedNodeSlateRootBefore = simulateDOMNodeBeforeMutations(editorRef.current, mutations.slice(index));
			const simulatedNodeSlateRootAfter = simulateDOMNodeBeforeMutations(editorRef.current, mutations.slice(index + 1));

			const context = {
				simulatedNodeSlateRootBefore,
				simulatedNodeSlateRootAfter,
				simulatedTargetBefore: findSimulatedNodeRecursively(mutation.target, simulatedNodeSlateRootBefore),
				simulatedTargetAfter: findSimulatedNodeRecursively(mutation.target, simulatedNodeSlateRootAfter)
			};

			if (mutation.type === 'characterData') {
				commands.push(...processCharacterData(mutation, context));
			} else if (mutation.type === 'childList') {
				commands.push(...processChildList(mutation, context));
			}
		});

		flushCommands(commands);
	};

	const flushCommands = (commands) => {
		if (commands.length > 0) {
			commandStream(commands);
		}
	};

	return (mutations) => {
		flushAction(mutations);
	}
}
