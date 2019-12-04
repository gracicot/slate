import React from "react";

export default [
	{
		dom: (keyStart) => (
			<div data-slate-object="block" data-key={keyStart + 1} style={{'position': 'relative'}}>
				<span data-slate-object="text" data-key={keyStart + 2}>
					<span data-slate-leaf="true" data-offset-key={`${keyStart + 2}:0`}>
						<span data-slate-zero-width="n" data-slate-length="0"><br/></span>
					</span>
				</span>
			</div>
		),
		value: {
			"object": "value",
			"document": {
				"object": "document",
				"nodes": [
					{
						"object": "block",
						"type": "generic-block",
						"nodes": [
							{
								"object": "text",
								"text": ""
							},
						]
					}
				]
			}
		}
	},
	{
		dom: (keyStart) => (
			<div data-slate-object="block" data-key={keyStart + 1} style={{'position': 'relative'}}>
				<span data-slate-object="text" data-key={keyStart + 2}>
					<span data-slate-leaf="true" data-offset-key={`${keyStart + 2}:0`}>
						<span data-slate-string="true">a</span>
					</span>
				</span>
			</div>
		),
		value: {
			"object": "value",
			"document": {
				"object": "document",
				"nodes": [
					{
						"object": "block",
						"type": "generic-block",
						"nodes": [
							{
								"object": "text",
								"text": "a"
							},
						]
					}
				]
			}
		}
	},
	{
		dom: (keyStart) => (
			<div data-slate-object="block" data-key={keyStart + 1} style={{'position': 'relative'}}>
				<span data-slate-object="text" data-key={keyStart + 2}>
					<span data-slate-leaf="true" data-offset-key={`${keyStart + 2}:0`}>
						<span data-slate-string="true">{"\n"}<br /></span>
					</span>
				</span>
			</div>
		),
		value: {
			"object": "value",
			"document": {
				"object": "document",
				"nodes": [
					{
						"object": "block",
						"type": "generic-block",
						"nodes": [
							{
								"object": "text",
								"text": "\n"
							},
						]
					}
				]
			}
		}
	},
	{
		dom: (keyStart) => (
			<div data-slate-object="block" data-key={keyStart + 1} style={{'position': 'relative'}}>
				<span data-slate-object="text" data-key={keyStart + 2}>
					<span data-slate-leaf="true" data-offset-key={`${keyStart + 2}:0`}>
						<span data-slate-string="true">{"a\n"}<br /></span>
					</span>
				</span>
			</div>
		),
		value: {
			"object": "value",
			"document": {
				"object": "document",
				"nodes": [
					{
						"object": "block",
						"type": "generic-block",
						"nodes": [
							{
								"object": "text",
								"text": "a\n"
							},
						]
					}
				]
			}
		}
	},
	{
		dom: (keyStart) => (<>
			<div data-slate-object="block" data-key={keyStart + 1} style={{'position': 'relative'}}>
				<span data-slate-object="text" data-key={keyStart + 2}>
					<span data-slate-leaf="true" data-offset-key={`${keyStart + 2}:0`}>
						<span data-slate-string="true">a</span>
					</span>
				</span>
			</div>
			<div data-slate-object="block" data-key={keyStart + 3} style={{'position': 'relative'}}>
				<span data-slate-object="text" data-key={keyStart + 4}>
					<span data-slate-leaf="true" data-offset-key={`${keyStart + 4}:0`}>
						<span data-slate-zero-width="n" data-slate-length="0"><br /></span>
					</span>
				</span>
			</div>
		</>),
		value: {
			"object": "value",
			"document": {
				"object": "document",
				"nodes": [
					{
						"object": "block",
						"type": "generic-block",
						"nodes": [
							{
								"object": "text",
								"text": "a"
							},
						]
					},
					{
						"object": "block",
						"type": "generic-block",
						"nodes": [
							{
								"object": "text",
								"text": ""
							},
						]
					}
				]
			}
		}
	},
	{
		dom: (keyStart) => (<>
			<div className="toplevel" data-slate-object="block" data-key={keyStart + 1}>
				<div className="paragraph" data-slate-object="block" data-key={keyStart + 2}>
					<span className="styled" data-slate-object="block" data-key={keyStart + 3}>
						<span data-slate-object="text" data-key={keyStart + 4}>
							<span data-slate-leaf="true" data-offset-key={`${keyStart + 4}:0`}>
								<span data-slate-string="true">Some </span>
							</span>
						</span>
						<span data-slate-object="text" data-key={keyStart + 5}>
							<span data-slate-leaf="true" data-offset-key={`${keyStart + 5}:0`}>
								<span className="orange">
									<span data-slate-string="true">more</span>
								</span>
							</span>
						</span>
						<span data-slate-object="text" data-key={keyStart + 6}>
							<span data-slate-leaf="true" data-offset-key={`${keyStart + 6}:0`}>
								<span data-slate-string="true"> complicated</span>
							</span>
						</span>
					</span>
					<span className="default-element" data-slate-object="block" data-key={keyStart + 7}>
						<span data-slate-object="text" data-key={keyStart + 8}>
							<span data-slate-leaf="true" data-offset-key={`${keyStart + 8}:0`}>
								<span data-slate-string="true"> </span>
							</span>
						</span>
						<span data-slate-object="text" data-key={keyStart + 9}>
							<span data-slate-leaf="true" data-offset-key={`${keyStart + 9}:0`}>
								<span className="orange">
									<span data-slate-string="true">nested</span>
								</span>
							</span>
						</span>
						<span data-slate-object="text" data-key={keyStart + 10}>
							<span data-slate-leaf="true" data-offset-key={`${keyStart + 10}:0`}>
								<span data-slate-string="true"> </span>
							</span>
						</span>
						<span data-slate-object="text" data-key={keyStart + 11}>
							<span data-slate-leaf="true" data-offset-key={`${keyStart + 11}:0`}>
								<span className="green">
									<span data-slate-string="true">style</span>
								</span>
							</span>
						</span>
						<span data-slate-object="text" data-key={keyStart + 12}>
							<span data-slate-leaf="true" data-offset-key={`${keyStart + 12}:0`}>
								<span data-slate-string="true">.</span>
							</span>
						</span>
					</span>
				</div>
				<div className="paragraph" data-slate-object="block" data-key={keyStart + 13}>
					<span className="default-element" data-slate-object="block" data-key={keyStart + 14}>
						<span data-slate-object="text" data-key={keyStart + 15}>
							<span data-slate-leaf="true" data-offset-key={`${keyStart + 15}:0`}>
								<span data-slate-zero-width="n" data-slate-length="0">a</span>
							</span>
						</span>
					</span>
				</div>
				<div className="paragraph" data-slate-object="block" data-key={keyStart + 16}>
					<span className="default-element" data-slate-object="block" data-key={keyStart + 17}>
						<span data-slate-object="text" data-key={keyStart + 18}>
							<span data-slate-leaf="true" data-offset-key={`${keyStart + 18}:0`}>
								<span data-slate-string="true">Some </span>
							</span>
						</span>
						<span data-slate-object="text" data-key={keyStart + 19}>
							<span data-slate-leaf="true" data-offset-key={`${keyStart + 19}:0`}>
								<span className="orange">
									<span data-slate-string="true">additionnal text</span>
								</span>
							</span>
						</span>
						<span data-slate-object="text" data-key={keyStart + 20}>
							<span data-slate-leaf="true" data-offset-key={`${keyStart + 20}:0`}>
								<span data-slate-string="true">.</span>
							</span>
						</span>
					</span>
				</div>
			</div>
			<div className="toplevel" data-slate-object="block" data-key={keyStart + 21}>
				<div className="paragraph" data-slate-object="block" data-key={keyStart + 22}>
					<span className="default-element" data-slate-object="block" data-key={keyStart + 23}>
						<span data-slate-object="text" data-key={keyStart + 24}>
							<span data-slate-leaf="true" data-offset-key={`${keyStart + 24}:0`}>
								<span data-slate-string="true">Potatoes </span>
							</span>
						</span>
						<span data-slate-object="text" data-key={keyStart + 25}>
							<span data-slate-leaf="true" data-offset-key={`${keyStart + 25}:0`}>
								<span className="orange">
									<span data-slate-string="true">and carrots</span>
								</span>
							</span>
						</span>
						<span data-slate-object="text" data-key={keyStart + 26}>
							<span data-slate-leaf="true" data-offset-key={`${keyStart + 26}:0`}>
								<span data-slate-string="true"> grow </span>
							</span>
						</span>
					</span>
					<span className="styled" data-slate-object="block" data-key={keyStart + 27}>
						<span data-slate-object="text" data-key={keyStart + 28}>
							<span data-slate-leaf="true" data-offset-key={`${keyStart + 28}:0`}>
								<span data-slate-object="mark">
									<span data-slate-string="true">in </span>
								</span>
							</span>
						</span>
						<span data-slate-object="text" data-key={keyStart + 29}>
							<span data-slate-leaf="true" data-offset-key={`${keyStart + 29}:0`}>
								<span className="green">
									<span data-slate-string="true">fields</span>
								</span>
							</span>
						</span>
					</span>
				</div>
			</div>
		</>),
		value: {
			"object": "value",
			"document": {
				"object": "document",
				"nodes": [
					{
						"object": "block",
						"type": "toplevel",
						"nodes": [
							{
								"object": "block",
								"type": "paragraph",
								"nodes": [
									{
										"object": "block",
										"type": "element-styled",
										"nodes": [
											{
												"object": "text",
												"text": "Some "
											},
											{
												"object": "text",
												"text": "more",
												"marks": [
													{
														"object": "mark",
														"type": "orange"
													}
												]
											},
											{
												"object": "text",
												"text": " complicated"
											},
										]
									},
									{
										"object": "block",
										"type": "element-default",
										"nodes": [
											{
												"object": "text",
												"text": " ",
											},
											{
												"object": "text",
												"text": "nested",
												"marks": [
													{
														"object": "mark",
														"type": "orange",
													}
												]
											},
											{
												"object": "text",
												"text": " ",
											},
											{
												"object": "text",
												"text": "style",
												"marks": [
													{
														"object": "mark",
														"type": "green",
													}
												]
											},
											{
												"object": "text",
												"text": ".",
											}
										]
									}
								]
							},
							{
								"object": "block",
								"type": "paragraph",
								"nodes": [
									{
										"object": "block",
										"type": "element-default",
										"nodes": [
											{
												"object": "text",
												"text": "a"
											}
										]
									}
								]
							},
							{
								"object": "block",
								"type": "paragraph",
								"nodes": [
									{
										"object": "block",
										"type": "element-default",
										"nodes": [
											{
												"object": "text",
												"text": "Some "
											},
											{
												"object": "text",
												"text": "additionnal text",
												"marks": [
													{
														"object": "mark",
														"type": "orange"
													}
												]
											},
											{
												"object": "text",
												"text": "."
											}
										]
									}
								]
							}
						]
					},
					{
						"object": "block",
						"type": "toplevel",
						"nodes": [
							{
								"object": "block",
								"type": "paragraph",
								"nodes": [
									{
										"object": "block",
										"type": "element-default",
										"nodes": [
											{
												"object": "text",
												"text": "Potatoes "
											},
											{
												"object": "text",
												"text": "and carrots",
												"marks": [
													{
														"object": "mark",
														"type": "orange"
													}
												]
											},
											{
												"object": "text",
												"text": " grow "
											},
										]
									},
									{
										"object": "block",
										"type": "element-styled",
										"nodes": [
											{
												"object": "text",
												"text": "in",
												"marks": []
											},
											{
												"object": "text",
												"text": " ",
											},
											{
												"object": "text",
												"text": "fields",
												"marks": [
													{
														"object": "mark",
														"type": "green",
													}
												]
											}
										]
									}
								]
							}
						]
					},
				]
			}
		}
	},
	{
		dom: (keyStart) => (<>
			<div data-slate-object="block" data-key="1" style={{'position': 'relative'}}>
				<span data-slate-object="text" data-key="2">
					<span data-slate-leaf="true" data-offset-key="2:0">
						<span data-slate-string="true">{"a\nb"}<br /></span>
					</span>
				</span>
			</div>
		</>),
		value: {
			"object": "value",
			"document": {
				"object": "document",
				"nodes": [
					{
						"object": "block",
						"type": "generic-block",
						"nodes": [
							{
								"object": "text",
								"text": "a\nb"
							},
						],
					},
				],
			},
		},
	},
	{
		dom: (keyStart) => (<>
			<div data-slate-object="block" data-key={keyStart + 1} style={{'position': 'relative'}}>
				<span data-slate-object="text" data-key={keyStart + 2}>
					<span data-slate-leaf="true" data-offset-key={`${keyStart + 2}:0`}>
						<span data-slate-string="true">a</span>
					</span>
				</span>
			</div>
			<div data-slate-object="block" data-key={keyStart + 3} style={{'position': 'relative'}}>
				<span data-slate-object="text" data-key={keyStart + 4}>
					<span data-slate-leaf="true" data-offset-key={`${keyStart + 4}:0`}>
					<span data-slate-string="true">b</span>
					</span>
				</span>
			</div>
		</>),
		value: {
			"object": "value",
			"document": {
				"object": "document",
				"nodes": [
					{
						"object": "block",
						"type": "generic-block",
						"nodes": [
							{
								"object": "text",
								"text": "a"
							},
						],
					},
					{
						"object": "block",
						"type": "generic-block",
						"nodes": [
							{
								"object": "text",
								"text": "b"
							},
						],
					},
				],
			},
		},
	},
];
