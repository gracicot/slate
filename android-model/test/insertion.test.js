import { JSDOM } from "jsdom";
import { makeFlushFunction } from "../src/ModelEditor";
import {
	replayMutations,
	unserializeMutations
} from "../src/test-generator/replay-dom";
import expect from "expect";

import testcases from "./testcases"

function mutationTest(testcase, flush) {
	const dom = new JSDOM(testcase.data.dom);
	const mutations = unserializeMutations(
		dom,
		testcase.data.mutations,
		testcase.data.additionalNodes
	);
	
	const editor = dom.window.document.querySelector('[data-slate-editor="true"]');
	const flushFunction = makeFlushFunction(flush, {current: editor});
	
	flushFunction(mutations);
}

function replayDomTest(testcase, done, flush) {
	const dom = new JSDOM(testcase.data.initialDom);
	const editor = dom.window.document.querySelector('[data-slate-editor="true"]');
	
	const observer = new dom.window.MutationObserver(
		makeFlushFunction(mutations => {
			try {
				flush(mutations)
				done();
			} catch (e) {
				done(e);
			}
		}, {current: editor})
	);

	observer.observe(editor, {
		childList: true,
		characterData: true,
		attributes: true,
		subtree: true,
		characterDataOldValue: true
	});

	replayMutations(dom, testcase.data.operations);
}

describe("MutationObserver", () => {
	describe("Detect character insertion using the mutation observer", () => {
		
		it(`Case ${testcases.test1[0].id}: Can insert one character in an otherwise empty document on ${testcases.test1[0].platform}`, done => {
			const testcase = testcases.test1[0];

			replayDomTest(testcase, done, stream => {
				expect(stream.length).toEqual(1);

				expect(stream[0]).toMatchObject({
					type: "insertTextAtRange",
					text: "a"
				});
			});
			
			mutationTest(testcase, stream => {
				expect(stream.length).toEqual(1);

				expect(stream[0]).toMatchObject({
					type: "insertTextAtRange",
					text: "a"
				});
			});
		});
		
		it(`Case ${testcases.test2[0].id}: Can insert one character in an document that contains one letter on ${testcases.test2[0].platform}`, done => {
			const testcase = testcases.test2[0];

			replayDomTest(testcase, done, stream => {
				expect(stream.length).toEqual(1);

				expect(stream[0]).toMatchObject({
					type: "insertTextAtRange",
					text: "a"
				});
			});
			
			mutationTest(testcase, stream => {
				expect(stream.length).toEqual(1);

				expect(stream[0]).toMatchObject({
					type: "insertTextAtRange",
					text: "a"
				});
			});
		});
		
		it(`Case ${testcases.test2[1].id}: Can insert one character in an document that contains one letter on ${testcases.test2[1].platform}`, done => {
			const testcase = testcases.test2[1];

			replayDomTest(testcase, done, stream => {
				expect(stream.length).toEqual(1);

				expect(stream[0]).toMatchObject({
					type: "insertTextAtRange",
					text: "b"
				});
			});
			
			mutationTest(testcase, stream => {
				expect(stream.length).toEqual(1);

				expect(stream[0]).toMatchObject({
					type: "insertTextAtRange",
					text: "b"
				});
			});
		});
		
		// How to test if the case is meaningful?
		
		// it(`Case ${testcases.test3[0].id}: Can insert one character in a document that already contain one character on ${testcases.test3[0].platform}`, done => {
		// 	const testcase = testcases.test3[0];

		// 	replayDomTest(testcase, done, stream => {
		// 		expect(stream.length).toEqual(1);

		// 		expect(stream[0]).toMatchObject({
		// 			type: "insertTextAtRange",
		// 			text: "a"
		// 		});
		// 	});
			
		// 	mutationTest(testcase, stream => {
		// 		expect(stream.length).toEqual(1);

		// 		expect(stream[0]).toMatchObject({
		// 			type: "insertTextAtRange",
		// 			text: "a"
		// 		});
		// 	});
		// });
		
		it(`Case ${testcases.test4[0].id}: Add a letter in a document with a line break on ${testcases.test4[0].platform}`, done => {
			const testcase = testcases.test4[0];

			replayDomTest(testcase, done, stream => {
				expect(stream.length).toEqual(1);

				expect(stream[0]).toMatchObject({
					type: "insertTextAtRange",
					text: "a"
				});
			});
			
			mutationTest(testcase, stream => {
				expect(stream.length).toEqual(1);

				expect(stream[0]).toMatchObject({
					type: "insertTextAtRange",
					text: "a"
				});
			});
		});
		
		it(`Case ${testcases.test4[1].id}: Add a letter in a document with a line break on ${testcases.test4[1].platform}`, done => {
			const testcase = testcases.test4[1];

			replayDomTest(testcase, done, stream => {
				expect(stream.length).toEqual(1);

				expect(stream[0]).toMatchObject({
					type: "insertTextAtRange",
					text: "a"
				});
			});
			
			mutationTest(testcase, stream => {
				expect(stream.length).toEqual(1);

				expect(stream[0]).toMatchObject({
					type: "insertTextAtRange",
					text: "a"
				});
			});
		});
		
		xit(`Case ${testcases.test4[2].id}: Add a letter in a document with a line break on ${testcases.test4[2].platform}`, done => {
			const testcase = testcases.test4[2];

			replayDomTest(testcase, done, stream => {
				expect(stream.length).toEqual(1);

				expect(stream[0]).toMatchObject({
					type: "insertTextAtRange",
					text: "a"
				});
			});
			
			mutationTest(testcase, stream => {
				expect(stream.length).toEqual(1);

				expect(stream[0]).toMatchObject({
					type: "insertTextAtRange",
					text: "a"
				});
			});
		});
		
		xit(`Case ${testcases.test4[3].id}: Add a letter in a document with a line break on ${testcases.test4[3].platform}`, done => {
			const testcase = testcases.test4[3];

			replayDomTest(testcase, done, stream => {
				expect(stream.length).toEqual(1);

				expect(stream[0]).toMatchObject({
					type: "insertTextAtRange",
					text: "a"
				});
			});
			
			mutationTest(testcase, stream => {
				expect(stream.length).toEqual(1);

				expect(stream[0]).toMatchObject({
					type: "insertTextAtRange",
					text: "a"
				});
			});
		});
		
		xit(`Case ${testcases.test5[0].id}: Add a letter at the begining of a document with a line break on ${testcases.test5[0].platform}`, done => {
			const testcase = testcases.test5[0];

			replayDomTest(testcase, done, stream => {
				expect(stream.length).toEqual(1);

				expect(stream[0]).toMatchObject({
					type: "insertTextAtRange",
					text: "a"
				});
			});
			
			mutationTest(testcase, stream => {
				expect(stream.length).toEqual(1);

				expect(stream[0]).toMatchObject({
					type: "insertTextAtRange",
					text: "a"
				});
			});
		});
		
		xit(`Case ${testcases.test5[1].id}: Add a letter at the begining of a document with a line break on ${testcases.test5[1].platform}`, done => {
			const testcase = testcases.test5[1];

			replayDomTest(testcase, done, stream => {
				expect(stream.length).toEqual(1);

				expect(stream[0]).toMatchObject({
					type: "insertTextAtRange",
					text: "a"
				});
			});
			
			mutationTest(testcase, stream => {
				expect(stream.length).toEqual(1);

				expect(stream[0]).toMatchObject({
					type: "insertTextAtRange",
					text: "a"
				});
			});
		});
		
		xit(`Case ${testcases.test5[2].id}: Add a letter at the begining of a document with a line break on ${testcases.test5[2].platform}`, done => {
			const testcase = testcases.test5[2];

			replayDomTest(testcase, done, stream => {
				expect(stream.length).toEqual(1);

				expect(stream[0]).toMatchObject({
					type: "insertTextAtRange",
					text: "a"
				});
			});
			
			mutationTest(testcase, stream => {
				expect(stream.length).toEqual(1);

				expect(stream[0]).toMatchObject({
					type: "insertTextAtRange",
					text: "a"
				});
			});
		});
		
		xit(`Case ${testcases.test5[3].id}: Add a letter at the begining of a document with a line break on ${testcases.test5[3].platform}`, done => {
			const testcase = testcases.test5[3];

			replayDomTest(testcase, done, stream => {
				expect(stream.length).toEqual(1);

				expect(stream[0]).toMatchObject({
					type: "insertTextAtRange",
					text: "a"
				});
			});
			
			mutationTest(testcase, stream => {
				expect(stream.length).toEqual(1);

				expect(stream[0]).toMatchObject({
					type: "insertTextAtRange",
					text: "a"
				});
			});
		});
		
		xit(`Case ${testcases.test5[4].id}: Add a letter at the begining of a document with a line break on ${testcases.test5[4].platform}`, done => {
			const testcase = testcases.test5[4];

			replayDomTest(testcase, done, stream => {
				expect(stream.length).toEqual(1);

				expect(stream[0]).toMatchObject({
					type: "insertTextAtRange",
					text: "a"
				});
			});
			
			mutationTest(testcase, stream => {
				expect(stream.length).toEqual(1);

				expect(stream[0]).toMatchObject({
					type: "insertTextAtRange",
					text: "a"
				});
			});
		});
	});
});
