module.exports = function ({ types: t }) {
  function callInit(nodes) {
    for (node of nodes) {
      if (node.isFunctionDeclaration()) {
        const id = node.get('id');
        if (id.node.name === 'initModule') {
          return [
            t.returnStatement(
              t.identifier('initModule')
            ),
          ];
        }
      }
    }
    return null;
  }
  function sanitize(name) {
    return '_' + name.replace(/[^a-zA-Z0-9_]/g, '').replace(/^[^a-zA-Z_]+/, '');
  };
  function makeInit(arrayArgs) {
    const exports = t.identifier('_exports');
    const args = arrayArgs.get('elements');
    const fargs = args.map(arg => t.identifier(sanitize(arg.node.value)));
    const initCalls = fargs
      .filter(farg => farg.name !== sanitize('require'))
      .filter(farg => farg.name !== sanitize('module'))
      .map(farg => t.expressionStatement(
        t.callExpression(farg, [exports])
      ));
    return t.functionExpression(
      null,
      fargs,
      t.blockStatement([
        t.variableDeclaration('const', [
          t.variableDeclarator(
            exports, t.objectExpression([])
          )
        ]),
        ...initCalls,
        t.returnStatement(
          exports
        ),
      ])
    );
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
              const id = expression.get('callee');
              const args = expression.get('arguments');
              const lastArg = args.pop();
              const init = callInit(stmts)
              if (id.node.name === 'define' && lastArg.isFunctionExpression()) {
                const block = lastArg.get('body')
                let nodes = stmts.map(b => b.node);
                if (init) {
                  nodes = init.concat(nodes);
                }
                block.replaceWith(t.blockStatement(nodes))
              }
              if (!init) {
                lastArg.replaceWith(makeInit(args[0]))
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
