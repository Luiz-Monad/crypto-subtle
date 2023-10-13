module.exports = function ({ types: t }) {
  return {
    visitor: {
      Program: {
        exit(path) {
          const lastStatement = path.get('body').pop();
          if (lastStatement.isExpressionStatement()) {
            const expression = lastStatement.get('expression');
            if (expression.isCallExpression()) {
              const callee = expression.get('callee')
              if (callee.isFunctionExpression()) {
                const block = callee.get('body')
                if (block.isBlockStatement()) {
                  const body = block.get('body');
                  const nodes = body.map(b => b.node);
                  path.pushContainer('body', nodes);
                  lastStatement.insertBefore(t.emptyStatement())
                  lastStatement.remove();
                }
              }
            }
          }
        },
      }
    },
  };
};
