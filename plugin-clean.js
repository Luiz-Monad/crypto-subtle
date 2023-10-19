module.exports = function () {
  function isArrayBufferCheck(node) {
    // if (typeof(ArrayBuffer) === 'undefined')
    //     ^^^^^^^^^^^^^^^^^^^     ^^^^^^^^^^^
    return (
      node.isBinaryExpression() &&
      node.get('left').isUnaryExpression() &&
      node.get('left.operator').node === 'typeof' &&
      node.get('left.argument').node.name === 'ArrayBuffer' &&
      node.get('right').isStringLiteral() &&
      node.get('right.value').node === 'undefined'
    );
  }
  function isModuleCheck(node) {
    // if (typeof(module) !== 'undefined')
    //     ^^^^^^^^^^^^^^      ^^^^^^^^^^
    return (
      node.isBinaryExpression() &&
      node.get('left').isUnaryExpression() &&
      node.get('left.operator').node === 'typeof' &&
      node.get('left.argument').node.name === 'module' &&
      node.get('right').isStringLiteral() &&
      node.get('right.value').node === 'undefined'
    );
  }
  function isDefineCheck(node) {
    // if (typeof(define) !== 'function')
    //     ^^^^^^^^^^^^^^      ^^^^^^^^^
    return (
      node.isBinaryExpression() &&
      node.get('left').isUnaryExpression() &&
      node.get('left.operator').node === 'typeof' &&
      node.get('left.argument').node.name === 'define' &&
      node.get('right').isStringLiteral() &&
      node.get('right.value').node === 'function'
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
              if (isArrayBufferCheck(test)) {
                stmt.remove();
              }
              if (isModuleCheck(test)) {
                stmt.remove();
              }
              if (isDefineCheck(test)) {
                stmt.remove();
              }
            }
          }
        },
      }
    },
  };
};
