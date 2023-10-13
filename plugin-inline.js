module.exports = function ({ types: t }) {
  function hasInit(nodes) {
    for (node of nodes) {
      if (node.isFunctionDeclaration()) {
        const id = node.get('id');
        if (id.node.name === 'initModule') {
          return node;
        }
      }
    }
    return null;
  }
  function unwrap(func) {
    if (func.isFunctionDeclaration()) {
      const params = func.get('params');
      const block = func.get('body')
      if (block.isBlockStatement()) {
        const name = t.identifier(params[0].node.name);
        const body = block.get('body');
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
    }
    return [];
  }
  return {
    visitor: {
      Program: {
        exit(path) {
          const stmts = path.get('body');
          const lastStmt = stmts.pop();
          if (lastStmt.isExpressionStatement()) {
            const expression = lastStmt.get('expression');
            if (expression.isCallExpression()) {
              const id = expression.get('callee');
              const args = expression.get('arguments');
              const lastArg = args.pop();
              const init = hasInit(stmts)
              if (id.node.name === 'define' && lastArg.isFunctionExpression()) {
                const block = lastArg.get('body')
                let nodes = stmts.map(b => b.node);
                if (init) {
                  block.replaceWith(unwrap(init));
                } else {
                  block.replaceWith(t.blockStatement(nodes));
                }
              }
              for (stmt of stmts) {
                stmt.remove();
              }
            }
          }
        },
      }
    },
  };
};
