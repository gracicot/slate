export function getContentText(currentNode) {
	if (currentNode.nodeName === '#text') {
		return currentNode.textContent;
	} else if (currentNode.nodeName === 'BR') {
		return '\n';
	} else {
		let text = "";

		for (const child of currentNode.childNodes) {
			text += getContentText(child);
		}
		return text;
	}
}

export function getTrueContentText(simulatedNode) {
	if (simulatedNode.nodeName === '#text') {
		return simulatedNode.textContent;
	} else {
		let text = "";

		for (const child of simulatedNode.childNodes) {
			text += getContentText(child);
		}
		return text;
	}
}

export function getNodeHtml(simulatedNode) {
	let childString = '';
	
	if (simulatedNode.nodeName === '#text') {
		childString += simulatedNode.textContent;
	} else {
		for (const child of simulatedNode.childNodes) {
			childString += getNodeHtml(child);
		}
	}
	
	return `<${simulatedNode.nodeName}>${childString}</${simulatedNode.nodeName}>`
}

function getDOMNodeRepresentation(node) {
	return {
		childNodes: [],
		nextSibling: null,
		nodeName: node.nodeName,
		parentNode: null,
		previousSibling: null,
		realNode: node,
		textContent: node.nodeName === '#text' ? node.textContent : null,
		typeNode: node.dataset ? (node.dataset.slateEditor === "true" ? "editor" : (node.dataset.slateObject ? node.dataset.slateObject : null)) : null
	};
}

export function simulateDOMNode(node) {
	const root = getDOMNodeRepresentation(node);
	let prev = null;

	for (const child of node.childNodes) {
		root.childNodes.push(simulateDOMNode(child));
		const newChild = root.childNodes[root.childNodes.length - 1];

		if (prev) {
			prev.nextSibling = newChild;
		}

		newChild.previousSibling = prev;
		newChild.parentNode = root;
		prev = newChild;
	}
	return root;
}

function removeSimulatedNode(simulatedNode, removed) {
	if (removed.previousSibling) {
		removed.previousSibling.nextSibling = removed.nextSibling;
	}

	if (removed.nextSibling) {
		removed.nextSibling.previousSibling = removed.previousSibling;
	}

	const index = simulatedNode.childNodes.indexOf(removed);

	if (index !== -1) {
		simulatedNode.childNodes.splice(index, 1);
	}
}

function insertSimulatedNodeAfter(simulatedNode, added, after) {
	const index = after === null ? 0 : simulatedNode.childNodes.findIndex((element) => {
		return element.realNode === after;
	}) + 1;
	added.parentNode = simulatedNode;
	simulatedNode.childNodes.splice(index, 0, added);

	if (index > 0) {
		const prev = simulatedNode.childNodes[index - 1];
		added.previousSibling = prev;
		prev.nextSibling = added;
	}

	if (index + 1 < simulatedNode.childNodes.length) {
		const next = simulatedNode.childNodes[index + 1];
		added.nextSibling = next;
		next.previousSibling = added;
	}
}

function findSimulatedNode(search, haystack) {
	return haystack.find((element) => {
		return search === element.realNode;
	});
}

export function findSimulatedNodeRecursively(search, simulatedNode) {
	if (simulatedNode.realNode === search) {
		return simulatedNode;
	} else {
		for (const child of simulatedNode.childNodes) {
			const result = findSimulatedNodeRecursively(search, child);

			if (result !== null) {
				return result;
			}
		}
	}
	return null;
}

function reverseMutation(simulatedNode, mutation) {
	if (mutation.target !== simulatedNode.realNode) {
		for (let j = 0; j < simulatedNode.childNodes.length; ++j) {
			const child = simulatedNode.childNodes[j];
			const newChild = reverseMutation(child, mutation);

			if (newChild !== null) {
				simulatedNode.childNodes[j] = newChild;
				return simulatedNode;
			}
		}
		return null;
	} else {
		if (mutation.type === 'childList') {
			for (const added of mutation.addedNodes) {
				const currentNode = findSimulatedNode(added, simulatedNode.childNodes);
				removeSimulatedNode(simulatedNode, currentNode);
			}

			for (const removed of mutation.removedNodes) {
				insertSimulatedNodeAfter(simulatedNode, simulateDOMNode(removed), mutation.previousSibling);
			}
		} else if (mutation.type === 'characterData') {
			simulatedNode.textContent = mutation.oldValue;
		}
		return simulatedNode;
	}
}

function reverseMutations(simulatedNode, mutations) {
	for (let i = mutations.length - 1; i >= 0; --i) {
		const mutation = mutations[i];
		reverseMutation(simulatedNode, mutation);
	}
	return simulatedNode;
}

export function simulateDOMNodeBeforeMutations(node, mutations) {
	const simulatedNode = simulateDOMNode(node);
	return reverseMutations(simulatedNode, mutations);
}