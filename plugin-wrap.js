module.exports = function ({ types: t }) {
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
  function makeWrappedBody(_name, body) {
    const name = t.identifier(_name);
    // >>> define(['module', 'require'], function() {
    // >>>   var sjcl = global.sjcl;
    // >>>   /*body*/
    // >>>   ;
    // >>>   return sjcl;    
    // >>> });
    return t.callExpression(
      t.identifier('define'), [
      t.arrayExpression([
        t.StringLiteral('module'),
        t.StringLiteral('require'),
      ]),
      t.functionExpression(null, [],
        t.blockStatement([
          t.variableDeclaration('var', [
            t.variableDeclarator(
              name,
              t.memberExpression(
                t.identifier('global'),
                name
              )
            )
          ]),
          ...(body.map(n => n.node)),
          t.emptyStatement(),
          t.returnStatement(
            name
          ),
        ])
      ),
    ]
    );
  }
  function getMemberIdentifier(node) {
    let o = node;
    do {
      o = o.get('object');
    } while (o.isMemberExpression());
    return o.isIdentifier() ? o : null;
  }
  function isModName(node) {
    // sjcl.codec.arrayBuffer = {};
    //     ^                  ^
    return (
      node.isExpressionStatement() &&
      node.get('expression').isAssignmentExpression() &&
      node.get('expression.left').isMemberExpression() &&
      getMemberIdentifier(node.get('expression.left')) &&
      getMemberIdentifier(node.get('expression.left')).node.name !== 'global'
    );
  }
  function getModName(node) {
    // sjcl.codec.arrayBuffer = {};
    // ^^^^
    return getMemberIdentifier(node.get('expression.left')).node.name;
  }
  function hasModName(nodes) {
    const nds = nodes.filter(isModName);
    return nds.length > 0 && nds[0];
  }
  return {
    visitor: {
      Program: {
        exit(path) {
          const stmts = path.get('body');
          if (!stmts.length) {
            return;
          }
          const lastStmt = stmts[stmts.length - 1];
          if (isDefineCall(lastStmt)) {
            return;
          }
          const name = hasModName(stmts);
          if (name) {
            lastStmt.insertBefore(makeWrappedBody(getModName(name), stmts));
            for (const stmt of stmts) {
              stmt.remove();
            }
          }
        },
      }
    },
  };
};
