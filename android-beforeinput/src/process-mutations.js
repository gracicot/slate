import { getContentText } from './dom-simulator'
import diffText from "./diff-text"
import { findSimulatedNodeRecursively } from "./dom-simulator";

function isEmptyNode(node) {
	return node.firstChild === null || (
		(
			node.firstChild.nodeName === 'BR' ||
			node.firstChild.nodeName === '#text'
		) && (
			getContentText(node) === '\n' ||
			getContentText(node) === ''
		)
	);
}

function nodeAccountsForPath(node) {
	return (
		node.nodeName !== '#text' && (
			node.dataset.slateObject === 'text' ||
			node.dataset.slateObject === 'inline' ||
			node.dataset.slateObject === 'block' ||
			node.dataset.slateEditor === 'true' || (
				node.nodeName !== '#text' &&
				isRootNode(node.parentNode)
			)
		)
	);
}

function isLastNodeInBlock(node) {
	if (node.dataset.slateObject === "block") {
		return true;
	}
	
	if (node.nextSibling !== null) {
		return false;
	}
	
	let currentNode = node.parentNode;
	
	while (currentNode !== null && !isRootNode(currentNode) && currentNode.dataset.slateObject !== "block") {
		if (currentNode.nextSibling !== null) {
			return false;
		}
		
		currentNode = currentNode.parentNode;
	}
	
	return true;
}

function isRootNode(node) {
	return node.dataset.slateEditor === 'true' || node.parentNode === null;
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

function getPointByOffset(node, searchOffset, anchor = true) {
	let offset = 0;
	const indexChild = [];
	let textNode = null;
	let currentNode = node;
	let end = false;

	if (node.childNodes.length > 0) {
		while (textNode === null && !end) {
			if (currentNode.dataset.slateObject === 'text') {
				const lengthCurrentNode = getContentText(currentNode).length;

				if ((offset <= searchOffset && (lengthCurrentNode + offset > searchOffset)) || (!anchor && lengthCurrentNode + offset === searchOffset)) {
					textNode = currentNode;
					break;
				} else {
					offset = offset + lengthCurrentNode;
				}
			}

			if (currentNode.dataset.slateObject !== 'text' && currentNode.childNodes.length > 0) {
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
		const path = getPathForNode(textNode);
		return {
			path,
			offset: searchOffset - offset
		}
	} else {
		const path = getPathForNode(node);
		return {
			path,
			offset: searchOffset
		}
	}
}

function getRangeText(simulatedNode, diff) {
	if (nodeAccountsForPath(simulatedNode)) {
		const pointAnchor = getPointByOffset(simulatedNode, diff.start, true);
		const pointFocus = diff.start === diff.end ? pointAnchor : getPointByOffset(simulatedNode, diff.end, false);
		return {
			anchor: pointAnchor,
			focus: pointFocus
		};
	} else {
		const pointAnchor = getPointForNode(simulatedNode, diff.start);
		const pointFocus = diff.start === diff.end ? pointAnchor : getPointForNode(simulatedNode, diff.end);
		return {
			anchor: pointAnchor,
			focus: pointFocus
		};
	}
}

function getRangeAddedNode(node, previousSibling, simulatedNodeSlateRoot) {
	const currentNode = findSimulatedNodeRecursively(node, simulatedNodeSlateRoot);
	let index = 0;
	const offset = 0;
	let point;

	if (!nodeAccountsForPath(currentNode)) {
		point = getPointForNode(currentNode, offset);
	} else {
		let path;

		if (previousSibling !== null) {
			const previous = findSimulatedNodeRecursively(previousSibling, simulatedNodeSlateRoot);

			for (let i = 0; i < previous.parentNode.childNodes.length; i++) {
				if (previous === previous.parentNode.childNodes[i]) {
					index = i + 1;
				}
			}

			path = getPathForNode(previous.parentNode);
		} else {
			path = getPathForNode(currentNode);
		}

		point= {path, offset}
	}

	const range = {
		anchor: point,
		focus: point
	};
	return {range, index};
}

function getPathForNode(node) {
	let currentNode = node
	const path = []
	
	while (!isRootNode(currentNode)) {
		if (
			currentNode.dataset.slateObject === 'text' ||
			currentNode.dataset.slateObject === 'block' ||
			currentNode.dataset.slateObject === 'inline' ||
			currentNode.parentNode.dataset.slateEditor === 'true'
		) {
			const index = Array.from(currentNode.parentNode.childNodes).indexOf(currentNode);
			path.unshift(index)
		}

		currentNode = currentNode.parentNode
	}

	return path
}

function getPointForNode(currentNode, initialOffset = 0) {
	let offset = initialOffset;

	while (!nodeAccountsForPath(currentNode)) {
		while (currentNode.previousSibling !== null) {
			currentNode = currentNode.previousSibling;
			offset += getContentText(currentNode).length;
		}

		currentNode = currentNode.parentNode;
	}

	const path = getPathForNode(currentNode);
	return {path, offset};
}

export function processCharacterData(mutation, context) {
	const commands = [];

	if (context.simulatedTargetBefore.parentNode === null) {
		return [];
	}

	const prevText = context.simulatedTargetBefore.textContent;
	const nextText = context.simulatedTargetAfter.textContent;

	if (nextText === prevText) {
		return commands;
	}

	const diff = diffText(prevText, nextText);
	const range = getRangeText(context.simulatedTargetBefore, diff);

	if (range !== null) {
		if (diff.insertText.length === 0) {
			commands.push({mutation, type: 'deleteAtRange', range, text: diff.removeText});
		}

		if (diff.insertText.length > 0) {
			commands.push({mutation, type: 'insertTextAtRange', range, text: diff.insertText});
		}
	}
	return commands;
}

export function processChildList(mutation, context) {
	const commands = [];
	
	const {
		simulatedNodeSlateRootBefore,
		simulatedTargetBefore,
		simulatedTargetAfter,
	} = context;
	
	if (mutation.target.dataset.slateEditor === "true" && simulatedTargetAfter.childNodes.length === 0) {
		return ([{mutation, type: 'restoreEditor'}])
	}

	if (mutation.target.dataset.slateEditor === "true" || mutation.target.dataset.slateObject === "block") {
		if (mutation.addedNodes.length === 1 && mutation.addedNodes[0].dataset && mutation.addedNodes[0].dataset.slateObject === 'block') {
			const {range, index} = getRangeAddedNode(mutation.target, mutation.previousSibling, simulatedNodeSlateRootBefore);
			commands.push({mutation, type: 'insertNodeByKey', range, index, node: 'block'});
		}
	}

	if (mutation.target.dataset.slateObject === "block") {
		if (mutation.addedNodes.length === 1 && mutation.addedNodes[0].dataset && mutation.addedNodes[0].dataset.slateObject === 'text') {
			const {range, index} = getRangeAddedNode(mutation.target, mutation.previousSibling, simulatedNodeSlateRootBefore);
			commands.push({mutation, type: 'insertNodeByKey', range, index, node: 'text'});
		}
	}

	let prevText = getContentText(simulatedTargetBefore);
	let nextText = getContentText(simulatedTargetAfter);

	prevText = deleteNewLine(simulatedTargetBefore, prevText);
	nextText = deleteNewLine(simulatedTargetAfter, nextText);

	if (prevText !== nextText) {
		const diff = diffText(prevText, nextText);
		const range = getRangeText(simulatedTargetBefore, diff);

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
				const simulatedRemoved = findSimulatedNodeRecursively(
					mutation.removedNodes[0],
					simulatedNodeSlateRootBefore
				)
				const path = getPathForNode(simulatedRemoved);
				commands.push({mutation, type: 'removeNodeByPath', path});
			}
		}
	}

	if (mutation.target.dataset.slateEditor === "true" || mutation.target.dataset.slateObject === "block") {
		if (mutation.removedNodes.length === 1 && mutation.removedNodes[0].dataset && mutation.removedNodes[0].dataset.slateObject === 'block') {
			const simulatedRemoved = findSimulatedNodeRecursively(
				mutation.removedNodes[0],
				simulatedNodeSlateRootBefore
			)
			const path = getPathForNode(simulatedRemoved);
			commands.push({mutation, type: 'removeNodeByPath', path});
		}
	}
	return commands;
}

function domPointToFurthestNode(domNode, domOffset, prefer) {
	if (domNode.nodeName !== '#text') {
		while (domNode.childNodes.length !== 0) {
			if (prefer === 'right') {
				if (domOffset === domNode.childNodes.length) {
					domNode = domNode.lastChild;
					domOffset = 0;
				} else {
					domNode = domNode.childNodes[domOffset]
					domOffset = 0
				}
			} else if (prefer === 'left') {
				if (domOffset === 0) {
					domNode = domNode.firstChild;
					domOffset = isEmptyNode(domNode) ? 0 : domNode.childNodes.length || domNode.textContent.length;
				} else {
					domNode = domNode.childNodes[domOffset - 1]
					domOffset = domNode.childNodes.length || domNode.textContent.length
				}
			}
		}
	}
	
	if (domNode.nodeName === 'BR') {
		let previousNode = domNode.previousSibling;
		
		if (previousNode !== null) {
			domOffset = previousNode.textContent.length;
			domNode = previousNode;
		}
	}
	
	return [domNode, domOffset];
}

function rangeNodeAndOffset(domRange) {
	const nodeInEditor = (node) => {
		return (
			(node && node.dataset && node.dataset.slateEditor === 'true') ||
			node.parentNode.closest('[data-slate-editor]') !== null
		);
	};
	
	if (nodeInEditor(domRange.startContainer) && nodeInEditor(domRange.endContainer)) {
		const [startNode, startOffset] = domPointToFurthestNode(domRange.startContainer, domRange.startOffset, 'right');
		const [endNode, endOffset] = domPointToFurthestNode(domRange.endContainer, domRange.endOffset, 'left');
		
		return {
			anchor: {
				node: startNode,
				offset: startOffset,
			},
			focus: {
				node: endNode,
				offset: endOffset,
			},
		};
	}
	
	return null;
}

export function getRangeFromDOMRange(staticRange) {
	const nodeAndOffset = rangeNodeAndOffset(staticRange);
	
	if (nodeAndOffset !== null) {
		const anchor = getPointForNode(nodeAndOffset.anchor.node, nodeAndOffset.anchor.offset);
		const focus = getPointForNode(nodeAndOffset.focus.node, nodeAndOffset.focus.offset);
		return {anchor, focus};
	} else {
		return null;
	}
}

export function processSelect() {
	const domSelection = window.getSelection();
	const domRange = domSelection.getRangeAt(0);
	const range = getRangeFromDOMRange(domRange);
	
	if (range !== null) {
		const isForward = domSelection.anchorNode === domRange.startContainer;
		
		return [{
			type: "select",
			range: {
				anchor: isForward ? range.anchor : range.focus,
				focus: isForward ? range.focus : range.anchor,
			}
		}];
	}
	
	return [];
}

function findCompositionStart(compositionText, text, cursorInText) {
	if (cursorInText === 0) return cursorInText;
	if (compositionText.length === cursorInText) return cursorInText - compositionText.length;
	
	const regionBegin = cursorInText - compositionText.length;
	const regionEnd = cursorInText + compositionText.length;
	const beginOverflow = regionBegin < 0 ? -1 * regionBegin : 0;
	const endOverflow = regionEnd > text.length ? regionEnd - text.length : 0;
	
	const textAround = text.substring(regionBegin - beginOverflow, regionEnd - endOverflow);
	const indexInSurrounding = textAround.indexOf(compositionText)
	
	return regionBegin + beginOverflow + indexInSurrounding;
}

export function findCompositionRange(event) {
	const domSelection = window.getSelection();
	const domRange = domSelection.getRangeAt(0);
	const range = rangeNodeAndOffset(domRange);
	
	const compositionStart = findCompositionStart(event.data || '', range.focus.node.textContent, range.focus.offset);
	
	return {
		anchor: getPointForNode(range.anchor.node, compositionStart),
		focus: getPointForNode(range.focus.node, compositionStart + event.data.length),
	};
}
