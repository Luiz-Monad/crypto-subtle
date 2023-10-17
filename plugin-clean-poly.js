module.exports = function () {
  function isGlobalCheck(node) {
    // if (typeof(ArrayBuffer) === 'undefined')
    //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    return (
      node.isBinaryExpression() &&
      node.get('left').isUnaryExpression() &&
      node.get('left.operator').node === 'typeof' &&
      node.get('left.argument').node.name === 'ArrayBuffer' &&
      node.get('operator').node === '===' &&
      node.get('right').isStringLiteral() &&
      node.get('right.value').node === 'undefined'
    );
  }
  return {
    visitor: {
      Program: {
        exit(path) {
          const stmts = path.get('body');
          for (const stmt of stmts) {
            if (stmt.isIfStatement()) {
              const test = stmt.get('test');
              if (isGlobalCheck(test)) {
                stmt.remove();
              }
            }
          }
        },
      }
    },
  };
};
