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
  return {
    visitor: {
      Program: {
        exit(path) {
          const stmts = path.get('body');
          const lastStmt = stmts.pop();
          if (isImmedInvokFunExpression(lastStmt)) {
            const nodes = getImmedInvokFunNodes(lastStmt);
            path.pushContainer('body', nodes.map(b => b.node));
            lastStmt.insertBefore(t.emptyStatement());
            lastStmt.remove();
          }
        },
      }
    },
  };
};
