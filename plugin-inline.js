module.exports = function ({ types: t }) {
  function isDefineCall(node) {
    // define(arg, function)
    // ^^^^^^      ^^^^^^^^
    return (
      node.isExpressionStatement() &&
      node.get('expression').isCallExpression() &&
      node.get('expression.callee').node.name === 'define' &&
      node.get('expression.arguments.1').isFunctionExpression()
    );
  }
  function getDefineBody(node) {
    // define(arg, function() { /*body*/ })
    //                          ^^^^^^^^
    return node.get('expression.arguments.1.body');
  }
  function isInitDecl(node) {
    // function initModule(forge) { /*body*/ }
    // ^^^^^^^^ ^^^^^^^^^^
    return (
      node.isFunctionDeclaration() &&
      node.get('id').node.name === 'initModule'
    );
  }
  function getInitName(node) {
    // function initModule(forge) { /*body*/ }
    //                     ^^^^^
    return node.get('params.0').node.name;
  }
  function getInitBody(node) {
    // function initModule(forge) { /*body*/ }
    //                              ^^^^^^^^
    return node.get('body.body');
  }
  function hasInitDecl(nodes) {
    const nds = nodes.filter(isInitDecl);
    return nds.length > 0 && nds[0];
  }
  function unwrapInitDecl(func) {
    const name = t.identifier(getInitName(func));
    const body = cleanReturn(getInitBody(func));
    // >>> var forge = global.forge;
    // >>> /*body*/
    // >>> ;
    // >>> return forge;    
    return t.blockStatement([
      t.variableDeclaration('var', [
        t.variableDeclarator(
          name,
          t.identifier('global.' + name.name)
        )
      ]),
      ...(body.map(n => n.node)),
      t.emptyStatement(),
      t.returnStatement(
        name
      ),
    ]);
  }
  function cleanReturn(nodes) {
    // { function x() { return; } ; stmt; return; if (test) { return }; }
    //                                    ^^^^^^              ^^^^^^
    for (const node of nodes) {
      if (node.isReturnStatement()) {
        node.remove();
      }
      if (node.isIfStatement()) {
        const _then = node.get('consequent');
        const _else = node.get('alternate');
        cleanReturn([_then]);
        if (_else) cleanReturn([_else]);
      }
      if (node.isBlockStatement()) {
        cleanReturn(node.get('body'));
      }
    }
    return nodes;
  }
  return {
    visitor: {
      Program: {
        exit(path) {
          const stmts = path.get('body');
          const lastStmt = stmts.pop();
          if (!isDefineCall(lastStmt)) {
            return;
          }
          const init = hasInitDecl(stmts);
          const block = getDefineBody(lastStmt);
          if (init) {
            block.replaceWith(unwrapInitDecl(init));
          } else {
            const nodes = stmts.map(n => n.node);
            block.replaceWithMultiple(nodes);
          }
          for (stmt of stmts) {
            stmt.remove();
          }
        },
      }
    },
  };
};
