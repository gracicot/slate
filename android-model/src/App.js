import React, {useState, useCallback, useRef} from "react";
import {Editor} from "druide-slate-react";
import {Range, Value, Document, Point, Block, Text} from "slate";
import ModelEditor from "./ModelEditor";
import documents from "./Documents";

const level = 2;

function StyledNode(props) {
	return (
		<span className="styled" {...props.attributes}>
			{props.children}
		</span>
	);
}

function DefaultElementNode(props) {
	return (
		<span className="default-element" {...props.attributes}>
			{props.children}
		</span>
	);
}

function TopLevelNode(props) {
	return (
		<div className="toplevel" {...props.attributes}>
			{props.children}
		</div>
	);
}

function ParagraphNode(props) {
	return (
		<div className="paragraph" {...props.attributes}>
			{props.children}
		</div>
	);
}

const renderBlock = (props, editor, next) => {
	switch (props.node.type) {
		case "element-styled":
			return <StyledNode {...props} />;
		case "element-default":
			return <DefaultElementNode {...props} />;
		case "toplevel":
			return <TopLevelNode {...props} />;
		case "paragraph":
			return <ParagraphNode {...props} />;
		default:
			return next();
	}
};

const renderMark = (props, editor, next) => {
	switch (props.mark.type) {
		case "orange":
			return <span className="orange">{props.children}</span>;
		case "green":
			return <span className="green">{props.children}</span>;
		default:
			return next();
	}
};

const SlateEditor = React.forwardRef((props, ref) => {
	const [slate, slateChange] = useState({value: Value.create(documents[0].value)});

	if (props.applySlateValue) {
		props.applySlateValue(slateChange);
	}

	return (
		<Editor
			ref={ref}
			value={slate.value}
			onChange={slateChange}
			renderBlock={renderBlock}
			renderMark={renderMark}
			spellCheck={false}
			className="line-ajust"
		/>
	);
});

function TextEditorPanel() {
	const editor = React.createRef();
	const [reactKey, setKey] = useState(1);
	const [keyStart, setKeyStart] = useState(0);
	const [vanilla, applyVanilla] = useState(documents[0].dom(keyStart));

	const applySlate = useRef(null);

	function getPointSlate(point) {
		const path = [].concat(point.path);

		for (let i = path.length; i < level; i++) {
			path.push(0);
		}
		return Point.create({
			path,
			offset: point.offset,
		});
	}

	function resolveRange(rangePath, forNode = false) {
		const lengthPath = rangePath.anchor.path.length;

		const document = editor.current.value.document;
		const rangeText = Range.fromJSON({
			anchor: getPointSlate(rangePath.anchor),
			focus: getPointSlate(rangePath.focus)
		});
		const range = rangeText.normalize(document);

		if (!forNode) {
			return range
		}

		let key = range.start.key;

		for (let i = lengthPath; i < level; i++) {
			const parent = editor.current.value.document.getParent(key);
			key = parent.key;
		}
		return Range.fromJSON({
			anchor: {key, offset: range.start.offset, path: rangePath.anchor.path},
			focus: {key, offset: range.end.offset, path: rangePath.focus.path},
		});
	}

	function makeSlateCommandArgs(command) {
		switch (command.type) {
			case 'insertText': {
				return [command.text];
			}
			case 'select': {
				const range = resolveRange(command.range);
				return [range];
			}
			case 'insertTextAtRange': {
				const range = resolveRange(command.range);
				return [range, command.text];
			}
			case 'deleteBackward': {
				return [command.n];
			}
			case 'deleteAtRange': {
				const range = resolveRange(command.range);
				return [range, command.text];
			}
			case 'insertNodeByKey': {
				const node = command.node === 'block' ? Block.create("") : Text.create("");
				const range = Range.fromJSON({
					anchor: command.range.anchor,
					focus: command.range.focus
				});
				const document = editor.current.value.document;
				const parent = document.getNode(range.start.path);
				const key = parent.key;
				const index = command.index;
				return [key, index, node];
			}
			case 'splitInlineAtRange': {
				const range = resolveRange(command.range);
				return [range];
			}
			case 'removeNodeByKey': {
				const range = resolveRange(command.range, true);
				const key = range.start.key;
				return [key];
			}
			case 'splitBlock':
			case 'splitInline':
			case 'restoreDOM': {
				return [];
			}

			default: {
				throw new Error("Missing command");
			}
		}
	}

	const commandStream = (commands) => {
		if (!editor.current) {
			return;
		}

		console.log('stream says:', commands.length, commands.slice());

		editor.current.withoutNormalizing(() => {
			for (const command of commands) {
				if (command.type === "restoreEditor") {
					editor.current = applyDocument({target: {dataset: {documentIndex: 0}}});
					break;
				} else {
					editor.current[command.type](...makeSlateCommandArgs(command));
				}
			};
		});
	}

	const applyDocument = useCallback(
		event => {
			const documentIndex = parseInt(event.target.dataset.documentIndex, 10);

			if (!isNaN(documentIndex)) {
				const dummyDocument = Document.create({nodes: []});

				if (applySlate.current) {
					applySlate.current({value: Value.create(documents[documentIndex].value)});
				}

				setKey(reactKey + 1);
				setKeyStart(parseInt(dummyDocument.key, 10) + 1);
				applyVanilla(documents[documentIndex].dom(parseInt(dummyDocument.key, 10) + 1));
			}
		},
		[applySlate, applyVanilla, reactKey]
	);

	return (
		<>
			<div className="parent">
				<h3>Vanilla ContentEditable</h3>
				<ModelEditor key={reactKey} keyStart={keyStart} commandStream={commandStream} initialValue={vanilla}/>
			</div>
			<div className="parent">
				<h3>Slate Editor</h3>
				<SlateEditor ref={editor} applySlateValue={useCallback(setSlate => applySlate.current = setSlate, [])}/>
			</div>
			<div className="parent">
				<h3>Pre-Rendered Documents</h3>
				<div className="document-selector">
					<div className="documents">
						<span data-document-index="0" onClick={applyDocument}>1</span>
						<span data-document-index="1" onClick={applyDocument}>2</span>
						<span data-document-index="2" onClick={applyDocument}>3</span>
						<span data-document-index="3" onClick={applyDocument}>4</span>
						<span data-document-index="4" onClick={applyDocument}>5</span>
						<span data-document-index="5" onClick={applyDocument}>6</span>
						<span data-document-index="6" onClick={applyDocument}>7</span>
						<span data-document-index="7" onClick={applyDocument}>8</span>
					</div>
				</div>
			</div>
		</>
	);
}

export default function App() {
	return (
		<div className="App">
			<span className="soft-title">Test new Android model</span>
			<TextEditorPanel/>
		</div>
	);
}

;
