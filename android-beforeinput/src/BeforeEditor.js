import React, {useEffect, useRef} from "react";
import documents from "./Documents";
import { processSelect, findCompositionRange, getRangeFromDOMRange } from "./process-mutations";

	
function pathEqual(path1, path2) {
	if (path1.length !== path2.length) return false;
	
	for (let i = 0 ; i < path1.length ; ++i) {
		if (path1[i] !== path2[i]) return false;
	}
	
	return true;
}

export default function BeforeEditor(props = {
	initialValue: documents[0].dom,
	commandStream: () => {}
}) {
	const {commandStream} = props;
	const editable = useRef(null);
	
	useEffect(() => {
		let compositionState = null;
		
		const pushCommand = (commands) => {
			if (compositionState === null) {
				commandStream(commands);
			} else {
				compositionState.commands.push(...commands);
			}
		}
		
		const flushComposition = () => {
			commandStream(compositionState.commands)
			compositionState = null;
		}
		
		const startComposition = (event) => {
			compositionState = {
				startRange: findCompositionRange(event),
				lastRange: findCompositionRange(event),
				lastSelection: null,
				commands: []
			};
		}
		
		editable.current.addEventListener('beforeinput', event => {
			console.log('BeforeEditor:beforeinput', event.inputType, event.getTargetRanges())
			switch(event.inputType) {
				case 'insertText': {
					const [range] = event.getTargetRanges();
					pushCommand([{type: 'insertTextAtRange', text: event.data, range: getRangeFromDOMRange(range)}]);
					break;
				}
				case 'deleteContentBackward': {
					const ranges = event.getTargetRanges();
					pushCommand(ranges.map(range => ({type: 'deleteAtRange', range: getRangeFromDOMRange(range)})));
					break;
				}
				case 'insertCompositionText': {
					pushCommand([{type: 'insertTextAtRange', text: event.data, range: compositionState.lastRange}]);
					
					compositionState.lastRange = {
						...compositionState.lastRange,
						focus: {
							...compositionState.lastRange.focus,
							offset: compositionState.lastRange.anchor.offset + (event.data || '').length,
						},
					};
					break;
				}
				case 'insertReplacementText': {
					const [range] = event.getTargetRanges();
					const text = event.data || event.dataTransfer.getData('text/plain');
					pushCommand([{type: 'insertTextAtRange', text, range: getRangeFromDOMRange(range)}]);
					break;
				}
				case 'insertLineBreak':
				case 'insertParagraph': {
					pushCommand([{type: 'splitBlock'}]);
					break;
				}
			}
		})
		
		editable.current.addEventListener('compositionend', event => {
			console.log('BeforeEditor:compositionend')
			flushComposition();
		})
		
		editable.current.addEventListener('compositionupdate', event => {
			
			const {lastSelection} = compositionState;
			const compositionRange = compositionState.lastRange;
			
			if (compositionState.commands.length !== 0 && lastSelection !== null) {
				const selectionStartOffset = Math.min(lastSelection.focus.offset, lastSelection.anchor.offset)
				const selectionEndOffset = Math.max(lastSelection.focus.offset, lastSelection.anchor.offset)
				const compositionStartOffset = Math.min(compositionRange.focus.offset, compositionRange.anchor.offset)
				const compositionEndOffset = Math.max(compositionRange.focus.offset, compositionRange.anchor.offset)
				const selectionInSameNode = (
					pathEqual(lastSelection.focus.path, compositionRange.focus.path) &&
					pathEqual(lastSelection.anchor.path, compositionRange.anchor.path)
				);
				
				if (!selectionInSameNode || selectionStartOffset > compositionEndOffset || selectionEndOffset < compositionStartOffset) {
					compositionState = {
						...compositionState,
						startRange: findCompositionRange(event),
						lastRange: findCompositionRange(event),
						lastSelection: null
					};
					
					console.log('BeforeEditor:compositionupdate', compositionState)
					return;
				}
			}
			
			if (compositionState.commands.length === 0) {
				startComposition(event);
				console.log('BeforeEditor:compositionupdate', compositionState)
			} else {
				console.log('BeforeEditor:compositionupdate', null)
			}
		})
		
		editable.current.addEventListener('compositionstart', event => {
			startComposition(event);
			console.log('BeforeEditor:compositionstart', compositionState)
		})

		editable.current.ownerDocument.addEventListener('selectionchange', (event) => {
			if (event.currentTarget.activeElement === editable.current) {
				console.log('BeforeEditor:selectionchange', event)
				const [selection] = processSelect(event)
				
				if (compositionState !== null) {
					compositionState.lastSelection = selection.range;
				}
				
				if (selection) {
					if (compositionState === null || compositionState.commands.length === 0) {
						commandStream([selection]);
					} else {
						pushCommand([selection]);
					}
				}
			}
		});

		return () => {
		}
	});

	return (
		<div
			data-slate-editor="true"
			data-key={props.keyStart}
			ref={e => {editable.current = e;}}
			contentEditable="true" suppressContentEditableWarning
			className="line-ajust"
			autoCorrect="on"
			spellCheck="false"
			role="textbox"
			data-gramm="false"
			style={{
				outline: 'none',
				whiteSpace: 'pre-wrap',
				overflowWrap: 'break-word'
			}}
		>
			{props.initialValue}
		</div>
	);
}
