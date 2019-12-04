import { simulateDOMNodeBeforeMutations, getTrueContentText, findSimulatedNodeRecursively, getNodeHtml } from '../dom-simulator'

export function indexedDOM(parent, nodes = [], index = new Map([])) {
	index.set(parent, nodes.length);
	nodes.push(parent);
	
	if (parent.childNodes) {
		for (const node of parent.childNodes) {
			indexedDOM(node, nodes, index);
		}
	}
	
	return {
		nodes,
		index
	};
}

export function indexedDOMSimulation(parent, nodes = [], index = new Map([])) {
	index.set(parent.realNode, nodes.length);
	nodes.push(parent.realNode);
	
	if (parent.childNodes) {
		for (const node of parent.childNodes) {
			indexedDOMSimulation(node, nodes, index);
		}
	}
	
	return {
		nodes,
		index
	};
}

const mutationOperation = {
	createTextNode: (args, context) => {
		const text = context.document.createTextNode(args.initialValue)
		const parent = context.nodes[args.parent];
		
		if (args.atIndex !== undefined || parent.childNodes.length === args.atIndex) {
			parent.insertBefore(text, parent.childNodes[args.atIndex]);
		} else {
			parent.appendChild(text);
		}
		
		indexedDOM(text, context.nodes, context.index);
	},
	setTextContent: (args, context) => {
		context.nodes[args.node].textContent = args.value;
	},
	removeNode: (args, context) => {
		context.nodes[args.node].remove();
	},
	insertNode: (args, context) => {
		const insertNode = (node) => {
			const parent = context.nodes[args.parent];

			if (args.atIndex !== undefined || args.atIndex !== -1 || parent.childNodes.length !== args.atIndex) {
				parent.insertBefore(node, parent.childNodes[args.atIndex]);
			} else {
				parent.appendChild(node);
			}
		}
		
		if (args.html !== undefined) {
			const wrapper = context.document.createElement('div');
			wrapper.innerHTML = args.html;
			const node = wrapper.firstElementChild;
			
			insertNode(node);
			indexedDOM(node, context.nodes, context.index);
		} else if (args.node !== undefined) {
			const node = context.nodes[args.node];
			insertNode(node);
		}
	}
};

export function replayMutations(dom, operations) {
	const { window } = dom;
	const editor = window.document.querySelector('[data-slate-editor="true"]');
	const context = indexedDOM(editor)
	context.document = window.document;
	
	for (const operation of operations) {
		mutationOperation[operation.type](operation.data, context);
	}
}

export function unserializeMutations(dom, mutations, additionalNodes) {
	const { window } = dom;
	const editor = window.document.querySelector('[data-slate-editor="true"]');
	
	const {nodes, index} = indexedDOM(editor)
	
	for (const added of additionalNodes) {
		if (added.type === 'text') {
			const node = window.document.createTextNode(added.text);
			indexedDOM(node, nodes, index);
		} else {
			const wrapper = window.document.createElement('div');
			wrapper.innerHTML = added.html;
			indexedDOM(wrapper.firstElementChild, nodes, index);
		}
	}
	
	return mutations.map(mutation => ({
		...mutation,
		nextSibling: mutation.nextSibling === null ? null : nodes[mutation.nextSibling],
		previousSibling: mutation.previousSibling === null ? null : nodes[mutation.previousSibling],
		target: nodes[mutation.target],
		addedNodes: mutation.addedNodes.map(n => nodes[n]),
		removedNodes: mutation.removedNodes.map(n => nodes[n])
	}));
}

const addIfNotIndexed = (state, unknownNode, nodes, index, additionalNodes) => {
	const unknownIndex = index.get(unknownNode)
	
	if (unknownIndex === undefined) {
		const simulated = findSimulatedNodeRecursively(unknownNode, state);
		indexedDOMSimulation(simulated, nodes, index);
		
		if (simulated.nodeName === '#text') {
			additionalNodes.push({type: 'text', text: simulated.textContent});
		} else {
			additionalNodes.push({type: 'node', html: getNodeHtml(simulated)});
		}
		
		return true;
	}
	
	return false;
}

function recordMutationOperations(node, mutations, context) {
	const {nodes, index} = context;
	
	const operations = [];
	
	mutations.forEach((mutation, mutationIndex) => {
		const state = simulateDOMNodeBeforeMutations(node, mutations.slice(mutationIndex + 1));

		if (mutation.type === 'characterData') {
			const simulated = findSimulatedNodeRecursively(mutation.target, state);
			operations.push({type: 'setTextContent', data: {node: index.get(mutation.target), value: getTrueContentText(simulated)}});
		} else if (mutation.type === 'childList') {
			for (const added of mutation.addedNodes) {
				const simulated = findSimulatedNodeRecursively(added, state);
				const parent = index.get(simulated.parentNode.realNode)
				const atIndex = simulated.parentNode.childNodes.findIndex(n => n === simulated);
				
				if (added.nodeName === '#text') {
					operations.push({type: 'createTextNode', data: {parent, atIndex, initialValue: simulated.textContent}});
					index.set(added, nodes.length);
					nodes.push(added);
				} else {
					const addedIndex = index.get(added)

					if (addedIndex !== undefined) {
						operations.push({type: 'insertNode', data: {parent, atIndex, node: addedIndex}});
					} else {
						indexedDOMSimulation(simulated, nodes, index)
						operations.push({type: 'insertNode', data: {parent, atIndex, html: getNodeHtml(simulated)}});
					}
				}
			}
			
			for (const removed of mutation.removedNodes) {
				operations.push({type: 'removeNode', data: {node: index.get(removed)}});
			}
		}
	});
	
	return operations;
}

function serializeMutations(node, mutations) {
	const {nodes, index} = indexedDOM(node);
	
	const serializedMutations = [];
	const nodesToAdd = [];
	
	mutations.forEach((mutation, mutationIndex) => {
		const state = simulateDOMNodeBeforeMutations(node, mutations.slice(mutationIndex + 1));
		const stateBefore = simulateDOMNodeBeforeMutations(node, mutations.slice(mutationIndex));
		const simulated = findSimulatedNodeRecursively(mutation.target, state);
		
		if (mutation.type === 'characterData') {
			serializedMutations.push({
				addedNodes: [],
				attributName: null,
				attributNamespace: null,
				nextSibling: state.nextSibling ? index.get(state.nextSibling.realNode) : null,
				oldValue: getTrueContentText(state),
				previousSibling: state.previousSibling ? index.get(state.previousSibling.realNode) : null,
				removedNodes: [],
				target: index.get(mutation.target),
				type: 'characterData'
			});
		} else if (mutation.type === 'childList') {
			for (const added of mutation.addedNodes) {
				addIfNotIndexed(state, added, nodes, index, nodesToAdd);
			}
			
			for (const removed of mutation.removedNodes) {
				addIfNotIndexed(stateBefore, removed, nodes, index, nodesToAdd);
			}
			
			serializedMutations.push({
				addedNodes: Array.from(mutation.addedNodes).map(n => index.get(n)),
				attributName: null,
				attributNamespace: null,
				nextSibling: simulated.nextSibling ? index.get(simulated.nextSibling.realNode) : null,
				oldValue: null,
				previousSibling: simulated.previousSibling ? index.get(simulated.previousSibling.realNode) : null,
				removedNodes: Array.from(mutation.removedNodes).map(n => index.get(n)),
				target: index.get(mutation.target),
				type: 'childList'
			});
		}
	});
	
	return {serializedMutations, nodesToAdd};
}

export function recordMutations(node, mutations, initialState, context) {
	const {serializedMutations, nodesToAdd} = serializeMutations(node, mutations);
	const operations = recordMutationOperations(node, mutations, context);
	
	return {
		initialDom: initialState.outerHTML,
		operations,
		mutations: serializedMutations,
		additionalNodes: nodesToAdd,
		dom: node.outerHTML
	};
}