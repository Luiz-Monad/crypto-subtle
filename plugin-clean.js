module.exports = function () {
  return {
    visitor: {
      Program: {
        exit(path) {
          const stmts = path.get('body');
          for (stmt of stmts) {
            if (stmt.isIfStatement()) {
              const test = stmt.get('test');
              if (test.isBinaryExpression()) {
                const left = test.get('left');
                const op = test.get('operator');
                const right = test.get('right');
                if (left.isUnaryExpression() && left.get('operator').node === 'typeof' &&
                  left.get('argument').node.name === 'define' &&
                  op.node === '!==' &&
                  right.isStringLiteral() && right.get('value').node === 'function') {
                  stmt.remove();
                }
              }
            }
            if (stmt.isVariableDeclaration()) {
              const decl = stmt.get('declarations');
              if (decl.length === 1 && decl[0].isVariableDeclarator()) {
                const id = decl[0].get('id');
                const targetNames = ["deps", "defineFunc", "tmpDefine"];
                if (targetNames.includes(id.node.name)) {
                  stmt.remove();
                }
              }
            }
            if (stmt.isExpressionStatement()) {
              const expr = stmt.get('expression');
              if (expr.isAssignmentExpression()) {
                const left = expr.get('left');
                if (left.isIdentifier()) {
                  const targetNames = ["define"];
                  if (targetNames.includes(left.node.name)) {
                    stmt.remove();
                  }
                }
              }
            }
          }
        },
      }
    },
  };
};

