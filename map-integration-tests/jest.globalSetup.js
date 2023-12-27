// We mock usages of "document" for embedded SDK assets triggered by SDK imports in the node side of tests:
global.document = { createElement: jest.fn().mockReturnValue(jest.fn()) };
