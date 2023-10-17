module.exports = function () {
  function isDefineCheck(node) {
    // if (typeof(define) !== 'function')
    //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    return (
      node.isBinaryExpression() &&
      node.get('left').isUnaryExpression() &&
      node.get('left.operator').node === 'typeof' &&
      node.get('left.argument').node.name === 'define' &&
      node.get('operator').node === '!==' &&
      node.get('right').isStringLiteral() &&
      node.get('right.value').node === 'function'
    );
  }
  function isVariableToRemove(node) {
    // var trash = anything, more_vars
    //     ^^^^^
    const targetNames = ["deps", "defineFunc", "tmpDefine"];
    return (
      node.get('declarations').length === 1 &&
      node.get('declarations.0').isVariableDeclarator() &&
      targetNames.includes(node.get('declarations.0.id').node.name)
    );
  }
  function isDefineAssignment(node) {
    // define = giberish
    // ^^^^^^
    return (
      node.get('expression').isAssignmentExpression() &&
      node.get('expression.left').isIdentifier() &&
      node.get('expression.left.name').node === 'define'
    );
  }
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
  return {
    visitor: {
      Program: {
        exit(path) {
          const stmts = path.get('body');
          const lastStmt = stmts.pop();
          if (!isDefineCall(lastStmt)) {
            return;
          }
          for (const stmt of stmts) {
            if (stmt.isIfStatement()) {
              const test = stmt.get('test');
              if (isDefineCheck(test)) {
                stmt.remove();
              }
            }
            if (stmt.isVariableDeclaration()) {
              if (isVariableToRemove(stmt)) {
                stmt.remove();
              }
            }
            if (stmt.isExpressionStatement()) {
              if (isDefineAssignment(stmt)) {
                stmt.remove();
              }
            }
          }
        },
      }
    },
  };
};
