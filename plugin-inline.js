module.exports = function ({ types: t }) {
  function callInit(nodes) {
    for (node of nodes) {
      if (node.isFunctionDeclaration()) {
        const id = node.get('id');
        if (id.node.name === 'initModule') {
          return [
            t.returnStatement(
              t.callExpression(id.node, [
                t.identifier('arguments')
              ])
            )
          ];
        }
      }
    }
    return [];
  }
  return {
    visitor: {
      Program: {
        exit(path) {
          const stmts = path.get('body')
          const lastStmt = stmts.pop();
          if (lastStmt.isExpressionStatement()) {
            const expression = lastStmt.get('expression');
            if (expression.isCallExpression()) {
              const lastArg = expression.get('arguments').pop();
              if (lastArg.isFunctionExpression()) {
                const block = lastArg.get('body')
                let nodes = stmts.map(b => b.node);
                nodes = callInit(stmts).concat(nodes);
                block.replaceWith(t.blockStatement(nodes))
              }
            }
          }
          for (stmt of stmts) {
            stmt.remove();
          }
        },
      }
    },
  };
};
