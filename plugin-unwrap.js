module.exports = function ({ types: t }) {
  function isImmedInvokFunExpression(node) {
    //  (function(){ /*block_nodes*/ })()
    //   ^^^^^^^^^^
    return (
      node.isExpressionStatement() &&
      node.get('expression').isCallExpression() &&
      node.get('expression.callee').isFunctionExpression()
    );
  }
  function getImmedInvokFunNodes(node) {
    //  (function(){ /*block_nodes*/ })()
    //               ^^^^^^^^^^^^^^^
    return node.get('expression.callee.body.body');
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
      if (node.isTryStatement()) {
        const _block = node.get('block');
        const _catch = node.get('handler');
        cleanReturn([_block]);
        if (_catch) cleanReturn([_catch]);
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
          if (isImmedInvokFunExpression(lastStmt)) {
            const nodes = cleanReturn(getImmedInvokFunNodes(lastStmt));
            path.pushContainer('body', nodes.map(b => b.node));
            lastStmt.insertBefore(t.emptyStatement());
            lastStmt.remove();
          }
        },
      }
    },
  };
};
