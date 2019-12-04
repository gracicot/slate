import { JSDOM } from "jsdom";
import { makeFlushFunction } from "../src/ModelEditor";
import {
	replayMutations,
	unserializeMutations
} from "../src/test-generator/replay-dom";
import expect from "expect";

function mutationTestFromString(testcaseString, flush) {
	const testcase = JSON.parse(testcaseString);
	const dom = new JSDOM(testcase.dom);
	const mutations = unserializeMutations(
		dom,
		testcase.mutations,
		testcase.additionalNodes
	);
	const flushFunction = makeFlushFunction(flush);
	flushFunction(mutations);
}

describe("MutationObserver", () => {
	describe("Detect character insertion using the mutation observer", () => {
		it("Can insert one character", done => {
			const testcase = JSON.parse(
				String.raw`{"initialDom":"<div data-slate-editor=\"true\" data-key=\"0\" class=\"line-ajust\" autocorrect=\"on\" spellcheck=\"false\" role=\"textbox\" data-gramm=\"false\" style=\"outline: currentcolor none medium; white-space: pre-wrap; overflow-wrap: break-word;\" contenteditable=\"true\"><div data-slate-object=\"block\" data-key=\"1\" style=\"position: relative;\"><span data-slate-object=\"text\" data-key=\"2\"><span data-slate-leaf=\"true\" data-offset-key=\"2:0\"><span data-slate-zero-width=\"n\" data-slate-length=\"0\"><br></span></span></span></div></div>","operations":[{"type":"createTextNode","data":{"parent":4,"atIndex":0,"initialValue":"a"}}],"mutations":[{"addedNodes":[5],"attributName":null,"attributNamespace":null,"nextSibling":null,"oldValue":null,"previousSibling":null,"removedNodes":[],"target":4,"type":"childList"}],"additionalNodes":[],"dom":"<div data-slate-editor=\"true\" data-key=\"0\" class=\"line-ajust\" autocorrect=\"on\" spellcheck=\"false\" role=\"textbox\" data-gramm=\"false\" style=\"outline: currentcolor none medium; white-space: pre-wrap; overflow-wrap: break-word;\" contenteditable=\"true\"><div data-slate-object=\"block\" data-key=\"1\" style=\"position: relative;\"><span data-slate-object=\"text\" data-key=\"2\"><span data-slate-leaf=\"true\" data-offset-key=\"2:0\"><span data-slate-zero-width=\"n\" data-slate-length=\"0\">a<br></span></span></span></div></div>"}`
			);

			const dom = new JSDOM(testcase.initialDom);
			const finalDom = new JSDOM(testcase.dom);

			const checkStreamFunction = stream => {
				try {
					expect(stream.length).toEqual(1);

					expect(stream[0]).toMatchObject({
						type: "insertTextAtRange",
						text: "a"
					});
				} catch (e) {
					done(e);
					return;
				}

				done();
			};

			const observer = new dom.window.MutationObserver(
				makeFlushFunction(mutations => checkStreamFunction(mutations))
			);

			const editor = dom.window.document.querySelector(
				'[data-slate-editor="true"]'
			);

			observer.observe(editor, {
				childList: true,
				characterData: true,
				attributes: true,
				subtree: true,
				characterDataOldValue: true
			});

			replayMutations(dom, testcase.operations);

			const finalEditor = finalDom.window.document.querySelector(
				'[data-slate-editor="true"]'
			);
			expect(editor.outerHTML).toEqual(finalEditor.outerHTML);
		});
	});

	describe("Detect character insertion from mutations", () => {
		it("Detect insertion from an empty document", () => {
			const testString = String.raw`{"initialDom":"<div data-slate-editor=\"true\" data-key=\"0\" class=\"line-ajust\" autocorrect=\"on\" spellcheck=\"false\" role=\"textbox\" data-gramm=\"false\" style=\"outline: currentcolor none medium; white-space: pre-wrap; overflow-wrap: break-word;\" contenteditable=\"true\"><div data-slate-object=\"block\" data-key=\"1\" style=\"position: relative;\"><span data-slate-object=\"text\" data-key=\"2\"><span data-slate-leaf=\"true\" data-offset-key=\"2:0\"><span data-slate-zero-width=\"n\" data-slate-length=\"0\"><br></span></span></span></div></div>","operations":[{"type":"createTextNode","data":{"parent":4,"atIndex":0,"initialValue":"a"}}],"mutations":[{"addedNodes":[5],"attributName":null,"attributNamespace":null,"nextSibling":null,"oldValue":null,"previousSibling":null,"removedNodes":[],"target":4,"type":"childList"}],"additionalNodes":[],"dom":"<div data-slate-editor=\"true\" data-key=\"0\" class=\"line-ajust\" autocorrect=\"on\" spellcheck=\"false\" role=\"textbox\" data-gramm=\"false\" style=\"outline: currentcolor none medium; white-space: pre-wrap; overflow-wrap: break-word;\" contenteditable=\"true\"><div data-slate-object=\"block\" data-key=\"1\" style=\"position: relative;\"><span data-slate-object=\"text\" data-key=\"2\"><span data-slate-leaf=\"true\" data-offset-key=\"2:0\"><span data-slate-zero-width=\"n\" data-slate-length=\"0\">a<br></span></span></span></div></div>"}`;

			mutationTestFromString(testString, stream => {
				expect(stream.length).toEqual(1);

				expect(stream[0]).toMatchObject({
					type: "insertTextAtRange",
					text: "a"
				});
			});
		});
	});

	describe("Detect firefox breaks", () => {
		it("Detects firefox line breaks on a simple document", () => {
			const testString = String.raw`{"initialDom":"<div data-slate-editor=\"true\" data-key=\"0\" class=\"line-ajust\" autocorrect=\"on\" spellcheck=\"false\" role=\"textbox\" data-gramm=\"false\" style=\"outline: currentcolor none medium; white-space: pre-wrap; overflow-wrap: break-word;\" contenteditable=\"true\"><div data-slate-object=\"block\" data-key=\"1\" style=\"position: relative;\"><span data-slate-object=\"text\" data-key=\"2\"><span data-slate-leaf=\"true\" data-offset-key=\"2:0\"><span data-slate-zero-width=\"n\" data-slate-length=\"0\">ab<br></span></span></span></div></div>","operations":[{"type":"createTextNode","data":{"parent":4,"atIndex":0,"initialValue":"ab"}},{"type":"setTextContent","data":{"node":5,"value":"b"}},{"type":"setTextContent","data":{"node":7,"value":"a"}},{"type":"insertNode","data":{"parent":4,"atIndex":1,"html":"<BR></BR>"}},{"type":"insertNode","data":{"parent":3,"atIndex":0,"html":"<SPAN></SPAN>"}},{"type":"removeNode","data":{"node":7}},{"type":"createTextNode","data":{"parent":9,"atIndex":0,"initialValue":"a"}},{"type":"insertNode","data":{"parent":2,"atIndex":0,"html":"<SPAN></SPAN>"}},{"type":"removeNode","data":{"node":9}},{"type":"insertNode","data":{"parent":11,"atIndex":0,"node":9}},{"type":"insertNode","data":{"parent":1,"atIndex":0,"html":"<SPAN></SPAN>"}},{"type":"removeNode","data":{"node":11}},{"type":"insertNode","data":{"parent":12,"atIndex":0,"node":11}},{"type":"insertNode","data":{"parent":0,"atIndex":0,"html":"<DIV></DIV>"}},{"type":"removeNode","data":{"node":12}},{"type":"insertNode","data":{"parent":13,"atIndex":0,"node":12}},{"type":"removeNode","data":{"node":8}}],"mutations":[{"addedNodes":[5],"attributName":null,"attributNamespace":null,"nextSibling":null,"oldValue":null,"previousSibling":null,"removedNodes":[],"target":9,"type":"childList"},{"addedNodes":[],"attributName":null,"attributNamespace":null,"nextSibling":null,"oldValue":"abb\n","previousSibling":null,"removedNodes":[],"target":10,"type":"characterData"},{"addedNodes":[],"attributName":null,"attributNamespace":null,"nextSibling":null,"oldValue":"ab\n","previousSibling":null,"removedNodes":[],"target":5,"type":"characterData"},{"addedNodes":[12],"attributName":null,"attributNamespace":null,"nextSibling":null,"oldValue":null,"previousSibling":null,"removedNodes":[],"target":9,"type":"childList"},{"addedNodes":[4],"attributName":null,"attributNamespace":null,"nextSibling":null,"oldValue":null,"previousSibling":null,"removedNodes":[],"target":8,"type":"childList"},{"addedNodes":[],"attributName":null,"attributNamespace":null,"nextSibling":null,"oldValue":null,"previousSibling":4,"removedNodes":[5],"target":9,"type":"childList"},{"addedNodes":[5],"attributName":null,"attributNamespace":null,"nextSibling":9,"oldValue":null,"previousSibling":null,"removedNodes":[],"target":4,"type":"childList"},{"addedNodes":[3],"attributName":null,"attributNamespace":null,"nextSibling":null,"oldValue":null,"previousSibling":null,"removedNodes":[],"target":7,"type":"childList"},{"addedNodes":[],"attributName":null,"attributNamespace":null,"nextSibling":null,"oldValue":null,"previousSibling":3,"removedNodes":[4],"target":8,"type":"childList"},{"addedNodes":[4],"attributName":null,"attributNamespace":null,"nextSibling":8,"oldValue":null,"previousSibling":null,"removedNodes":[],"target":3,"type":"childList"},{"addedNodes":[2],"attributName":null,"attributNamespace":null,"nextSibling":null,"oldValue":null,"previousSibling":null,"removedNodes":[],"target":6,"type":"childList"},{"addedNodes":[],"attributName":null,"attributNamespace":null,"nextSibling":null,"oldValue":null,"previousSibling":2,"removedNodes":[3],"target":7,"type":"childList"},{"addedNodes":[3],"attributName":null,"attributNamespace":null,"nextSibling":7,"oldValue":null,"previousSibling":null,"removedNodes":[],"target":2,"type":"childList"},{"addedNodes":[1],"attributName":null,"attributNamespace":null,"nextSibling":null,"oldValue":null,"previousSibling":null,"removedNodes":[],"target":0,"type":"childList"},{"addedNodes":[],"attributName":null,"attributNamespace":null,"nextSibling":null,"oldValue":null,"previousSibling":1,"removedNodes":[2],"target":6,"type":"childList"},{"addedNodes":[2],"attributName":null,"attributNamespace":null,"nextSibling":6,"oldValue":null,"previousSibling":null,"removedNodes":[],"target":1,"type":"childList"},{"addedNodes":[],"attributName":null,"attributNamespace":null,"nextSibling":null,"oldValue":null,"previousSibling":null,"removedNodes":[12],"target":9,"type":"childList"}],"additionalNodes":[{"type":"node","html":"<BR></BR>"}],"dom":"<div data-slate-editor=\"true\" data-key=\"0\" class=\"line-ajust\" autocorrect=\"on\" spellcheck=\"false\" role=\"textbox\" data-gramm=\"false\" style=\"outline: currentcolor none medium; white-space: pre-wrap; overflow-wrap: break-word;\" contenteditable=\"true\"><div data-slate-object=\"block\" data-key=\"1\" style=\"position: relative;\"><span data-slate-object=\"text\" data-key=\"2\"><span data-slate-leaf=\"true\" data-offset-key=\"2:0\"><span data-slate-zero-width=\"n\" data-slate-length=\"0\">a</span></span></span></div><div data-slate-object=\"block\" data-key=\"1\" style=\"position: relative;\"><span data-slate-object=\"text\" data-key=\"2\"><span data-slate-leaf=\"true\" data-offset-key=\"2:0\"><span data-slate-zero-width=\"n\" data-slate-length=\"0\">b<br></span></span></span></div></div>"}`;

			mutationTestFromString(testString, stream => {
				expect(stream.length).toEqual(17);

				expect(stream[0]).toMatchObject({
					type: "insertTextAtRange",
					text: "ab"
				});
			});
		});
	});
});
