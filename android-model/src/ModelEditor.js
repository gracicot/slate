import diffText from "./DiffText"
import React, {useEffect, useRef} from "react";
import documents from "./Documents";

import { simulateDOMNodeBeforeMutations, getContentText, findSimulatedNodeRecursively } from "./dom-simulator";
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
	
	const flushFunction = makeFlushFunction(commandStream);

	useEffect(() => {
		const observer = new MutationObserver((mutations) => {
			if (!editable.current) return;
		
			const placeholder = editable.current.ownerDocument.createElement('div');
			placeholder.innerHTML = lastDOM.current;
			lastDOM.current = editable.current.outerHTML;
			
			console.log(
				"testcase",
				recordMutations(editable.current, mutations, placeholder.firstElementChild, recordContext.current)
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
			attributes: false,
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

function findNode(nodeList, value) {
	for (const node of nodeList) {
		if (node === value) {
			return node;
		}
	}

	return undefined;
}

function isTargetDetachedBefore(mutation, nextMutations) {
	const domNode = mutation.target;

	if (domNode.parentNode !== null) {
		return false;
	}

	for (const m of nextMutations) {
		if (m.type === 'childList' && findNode(m.removedNodes, domNode) !== undefined) {
			return false;
		}
	}

	return true;
}

function nextCharacterData(domNode, nextMutations) {
	for (const mutation of nextMutations) {
		if (mutation.type === 'characterData' && mutation.target === domNode) {
			return mutation;
		}
	}

	return undefined;
}

function newNodeText(mutation, nextMutations) {
	const domNode = mutation.target;
	const nextMutation = nextCharacterData(domNode, nextMutations);
	return nextMutation ? nextMutation.oldValue : domNode.textContent;
}

function getParentNode(node, mutations) {
	for (const mutation of mutations) {
		if (mutation.type === 'childList') {
			const index = Array.from(mutation.removedNodes).indexOf(node);

			if (index !== -1) {
				return mutation.target;
			}
		}
	}
	return node.parentNode;
}

function hasTypeNodeValid(node) {
	return node.typeNode === 'text' || node.typeNode === 'block' || node.typeNode === 'editor';
}

function isLastNodeInBlock(node) {
	if (node.typeNode === "block") {
		return true;
	}

	if (node.nextSibling !== null) {
		return false;
	}

	let currentNode = node.parentNode;

	while (currentNode !== null && (currentNode.typeNode !== "block")) {
		if (currentNode.nextSibling !== null) {
			return false;
		}

		currentNode = currentNode.parentNode;
	}
	return true;
}

function getNodeRacine(nextMutations, mutation, node = mutation.target) {
	if (node.dataset && node.dataset.slateEditor === 'true') {
		return node;
	} else {
		const parentNode = getParentNode(node, nextMutations);

		if (parentNode) {
			return getNodeRacine(nextMutations, mutation, parentNode);
		}
	}
}

function hasContentText(simulatedNode) {
	if (simulatedNode.nodeName === '#text') {
		return true;
	} else if (simulatedNode.nodeName === 'BR') {
		return true;
	} else {
		let has = false;

		for (let i = 0; i < simulatedNode.childNodes.length && !has; i++) {
			has = getContentText(simulatedNode.childNodes[i]);
		}
		return has;
	}
}

function deleteNewLine(simulateNode, text) {
	if (isLastNodeInBlock(simulateNode) && /\n$/i.test(text)) {
		const nbChild = simulateNode.childNodes.length;
		let indexChild = nbChild - 1;

		if (nbChild > 0) {
			while (indexChild >= 0) {
				if (hasContentText(simulateNode.childNodes[indexChild])) {
					break;
				}

				indexChild--;
			}
		}

		if (nbChild === 0 || /\n$/i.test(getContentText(simulateNode.childNodes[indexChild]))) {
			return text.substring(0, text.length - 1);
		}
	}
	return text;
}

function getPathForSimulatedNode(node) {
	let currentNode = node;
	const path = [];

	while (currentNode.parentNode !== null) {
		let index = 0;

		for (let i = 0; i < currentNode.parentNode.childNodes.length; i++) {
			if (currentNode.parentNode.childNodes[i] === currentNode) {
				index = i;
				break;
			}
		}

		path.unshift(index);
		currentNode = currentNode.parentNode;
	}
	return path;
}

function getPointForSimulatedNode(currentNode, initialOffset = 0) {
	let offset = initialOffset;

	while (!hasTypeNodeValid(currentNode)) {
		while (currentNode.previousSibling !== null) {
			currentNode = currentNode.previousSibling;
			offset += getContentText(currentNode).length;
		}

		currentNode = currentNode.parentNode;
	}

	const path = getPathForSimulatedNode(currentNode);
	return {path, offset};
}


function getPointByOffset(node, searchOffset, anchor = true) {
	let offset = 0;
	const indexChild = [];
	let textNode = null;
	let currentNode = node;
	let end = false;

	if (node.childNodes.length > 0) {
		while (textNode === null && !end) {
			if (currentNode.typeNode === 'text') {
				const lengthCurrentNode = getContentText(currentNode).length;

				if ((offset <= searchOffset && (lengthCurrentNode + offset > searchOffset)) || (!anchor && lengthCurrentNode + offset === searchOffset)) {
					textNode = currentNode;
					break;
				} else {
					offset = offset + lengthCurrentNode;
				}
			}

			if (currentNode.typeNode !== 'text' && currentNode.childNodes.length > 0) {
				currentNode = currentNode.childNodes[0];
				indexChild.push(0);
			} else if (currentNode.nextSibling !== null && indexChild.length > 0) {
				currentNode = currentNode.nextSibling;
			} else {
				let foundNode = false;

				while (!foundNode && !end) {
					const index = indexChild[indexChild.length - 1];

					if (index < currentNode.parentNode.childNodes.length - 1) {
						indexChild[indexChild.length - 1] = index + 1;
						currentNode = currentNode.parentNode.childNodes[index + 1];
						foundNode = true;
					} else {
						indexChild.pop();
						currentNode = currentNode.parentNode;

						if (currentNode === node) {
							end = true;
						}
					}
				}
			}
		}
	}

	if (textNode !== null) {
		const path = getPathForSimulatedNode(textNode);
		return {
			path,
			offset: searchOffset - offset
		}
	} else {
		const path = getPathForSimulatedNode(node);
		return {
			path,
			offset: searchOffset
		}
	}
}


function getRangeText(mutation, simulatedNodeSlateRacine, diff,) {
	const currentNode = findSimulatedNodeRecursively(mutation.target, simulatedNodeSlateRacine);

	if (hasTypeNodeValid(currentNode)) {
		const pointAnchor = getPointByOffset(currentNode, diff.start, true);
		const pointFocus = diff.start === diff.end ? pointAnchor : getPointByOffset(currentNode, diff.end, false);
		return {
			anchor: pointAnchor,
			focus: pointFocus
		};
	} else {
		const pointAnchor = getPointForSimulatedNode(currentNode, diff.start);
		const pointFocus = diff.start === diff.end ? pointAnchor : getPointForSimulatedNode(currentNode, diff.end);
		return {
			anchor: pointAnchor,
			focus: pointFocus
		};
	}
}


function getRangeAddedNode(node, previousSibling, simulatedNodeSlateRacine) {
	const currentNode = findSimulatedNodeRecursively(node, simulatedNodeSlateRacine);
	let index = 0;
	const offset = 0;
	let point;

	if (!hasTypeNodeValid(currentNode)) {
		point = getPointForSimulatedNode(currentNode, offset);
	} else {
		let path;

		if (previousSibling !== null) {
			const previous = findSimulatedNodeRecursively(previousSibling, simulatedNodeSlateRacine);

			for (let i = 0; i < previous.parentNode.childNodes.length; i++) {
				if (previous === previous.parentNode.childNodes[i]) {
					index = i + 1;
				}
			}

			path = getPathForSimulatedNode(previous.parentNode);
		} else {
			path = getPathForSimulatedNode(currentNode);
		}

		point= {path, offset}
	}

	const range = {
		anchor: point,
		focus: point
	};
	return {range, index};
}

function getRangeRemovedNode(node, simulatedNodeSlateRacine) {
	const currentNode = findSimulatedNodeRecursively(node, simulatedNodeSlateRacine);
	const offset = 0;
	const path = getPathForSimulatedNode(currentNode);
	const range = {
		anchor: {path, offset},
		focus: {path, offset}
	};
	return range;
}

function processCharacterData(mutation, context) {
	const nodeSlateRacine = getNodeRacine(context.nextMutations, mutation);
	const simulatedNodeSlateRacineBefore = simulateDOMNodeBeforeMutations(nodeSlateRacine, [mutation].concat(context.nextMutations));
	const simulatedNodeSlateRacineAfter = simulateDOMNodeBeforeMutations(nodeSlateRacine, context.nextMutations);
	const simulatedTarget = findSimulatedNodeRecursively(mutation.target, simulatedNodeSlateRacineAfter);
	const commands = [];

	if (isTargetDetachedBefore(mutation, context.nextMutations)) {
		return [];
	}

	const prevText = mutation.oldValue;
	const nextText = simulatedTarget.textContent;

	if (nextText === prevText) {
		return commands;
	}

	const diff = diffText(prevText, nextText);
	const range = getRangeText(mutation, simulatedNodeSlateRacineBefore, diff);

	if (range !== null) {
		if (diff.removeText.length > 0) {
			commands.push({mutation, type: 'deleteAtRange', range, text: diff.removeText});
		}

		if (diff.insertText.length > 0) {
			commands.push({mutation, type: 'insertTextAtRange', range, text: diff.insertText});
		}
	}
	return commands;
}

function processChildListByDiff(mutation, context) {
	const commands = [];
	const nodeSlateRacine = getNodeRacine(context.nextMutations, mutation);
	const simulatedNodeSlateRacineBefore = simulateDOMNodeBeforeMutations(nodeSlateRacine, [mutation].concat(context.nextMutations));
	const simulatedNodePrev = findSimulatedNodeRecursively(mutation.target, simulatedNodeSlateRacineBefore);
	const simulatedNodeSlateRacineAfter = simulateDOMNodeBeforeMutations(nodeSlateRacine, context.nextMutations);
	const simulatedNodeNext = findSimulatedNodeRecursively(mutation.target, simulatedNodeSlateRacineAfter);

	if (mutation.target.dataset.slateEditor === "true" && simulatedNodeNext.childNodes.length === 0) {
		return ([{mutation, type: 'restoreEditor'}])
	}

	if (mutation.target.dataset.slateEditor === "true" || mutation.target.dataset.slateObject === "block") {
		if (mutation.addedNodes.length === 1 && mutation.addedNodes[0].dataset && mutation.addedNodes[0].dataset.slateObject === 'block') {
			const {range, index} = getRangeAddedNode(mutation.target, mutation.previousSibling, simulatedNodeSlateRacineBefore);
			commands.push({mutation, type: 'insertNodeByKey', range, index, node: 'block'});
		}
	}

	if (mutation.target.dataset.slateObject === "block") {
		if (mutation.addedNodes.length === 1 && mutation.addedNodes[0].dataset && mutation.addedNodes[0].dataset.slateObject === 'text') {
			const {range, index} = getRangeAddedNode(mutation.target, mutation.previousSibling, simulatedNodeSlateRacineBefore);
			commands.push({mutation, type: 'insertNodeByKey', range, index, node: 'text'});
		}
	}

	let prevText = getContentText(simulatedNodePrev);
	let nextText = getContentText(simulatedNodeNext);

	prevText = deleteNewLine(simulatedNodePrev, prevText);
	nextText = deleteNewLine(simulatedNodeNext, nextText);

	if (prevText !== nextText) {
		const diff = diffText(prevText, nextText);
		const range = getRangeText(mutation, simulatedNodeSlateRacineBefore, diff);

		if (diff !== null && diff.removeText.length > 0) {
			commands.push({mutation, type: 'deleteAtRange', range, text: diff.removeText});
		}

		if (diff !== null && diff.insertText.length > 0) {
			commands.push({mutation, type: 'insertTextAtRange', range, text: diff.insertText});
		}
	}

	if (mutation.target.dataset.slateObject === "block") {
		if (mutation.removedNodes.length === 1 && mutation.removedNodes[0].dataset && mutation.removedNodes[0].dataset.slateObject === 'text') {
			if (mutation.addedNodes.length > 0 || mutation.nextSibling !== null || mutation.previousSibling !== null) {
				const range = getRangeRemovedNode(mutation.removedNodes[0], simulatedNodeSlateRacineBefore);
				commands.push({mutation, type: 'removeNodeByKey', range});
			}
		}
	}

	if (mutation.target.dataset.slateEditor === "true" || mutation.target.dataset.slateObject === "block") {
		if (mutation.removedNodes.length === 1 && mutation.removedNodes[0].dataset && mutation.removedNodes[0].dataset.slateObject === 'block') {
			const range = getRangeRemovedNode(mutation.removedNodes[0], simulatedNodeSlateRacineBefore);
			commands.push({mutation, type: 'removeNodeByKey', range});
		}
	}
	return commands;
}

function getPathForNode(node) {
	let currentNode = node;
	const path = [];

	while (currentNode.dataset.slateEditor !== "true") {
		let index = 0;

		for (let i = 0; i < currentNode.parentNode.childNodes.length; i++) {
			if (currentNode.parentNode.childNodes[i] === currentNode) {
				index = i;
				break;
			}
		}

		path.unshift(index);
		currentNode = currentNode.parentNode;
	}
	return path;
}

function getPointForNode(currentNode, initialOffset = 0) {
	let offset = initialOffset;

	while (!currentNode.dataset.slateObject || (currentNode.dataset.slateObject !== "text" && currentNode.dataset.slateObject !== "block")) {
		while (currentNode.previousSibling !== null) {
			currentNode = currentNode.previousSibling;
			offset += getContentText(currentNode).length;
		}

		currentNode = currentNode.parentNode;
	}

	const path = getPathForNode(currentNode);
	return {path, offset};
}



function processSelect() {
	const domSelection = window.getSelection();

	if (domSelection.anchorNode.parentNode.closest('[data-slate-editor]') !== null && domSelection.focusNode.parentNode.closest('[data-slate-editor]') !== null) {
		const anchor = getPointForNode(domSelection.anchorNode.parentNode, domSelection.anchorOffset, true);
		const focus = getPointForNode(domSelection.focusNode.parentNode, domSelection.focusOffset, true);
		const range = {
			anchor,
			focus
		};
		return [{type: "select", range}];
	} else {
		return [];
	}
}

export function makeFlushFunction(commandStream) {
	const flushAction = (mutations) => {
		const commands = [];

		mutations.forEach((mutation, index) => {
			mutation.idx = index;
			const context = {
				previousMutations: mutations.slice(0, index),
				nextMutations: mutations.slice(index + 1),
			};

			if (mutation.type === 'characterData') {
				commands.push(...processCharacterData(mutation, context));
			} else if (mutation.type === 'childList') {
				commands.push(...processChildListByDiff(mutation, context));
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
