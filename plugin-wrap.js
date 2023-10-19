module.exports = function ({ types: t }) {
  function makeWrappedBody(_name, body) {
    const name = t.identifier(_name);
    // >>> require('module');
    // >>> var sjcl = global.sjcl;
    // >>> /*body*/
    // >>> ;
    // >>> exports.sjcl = sjcl;
    return [
      t.expressionStatement(
        t.callExpression(
          t.identifier('require'), [
          t.stringLiteral('module'),
        ])
      ),
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
      t.expressionStatement(
        t.assignmentExpression(
          '=',
          t.memberExpression(
            t.identifier('exports'),
            name
          ),
          name
        )
      ),
    ];
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
          const name = hasModName(stmts);
          if (name && getModName(name) === 'sjcl') {
            name.insertBefore(makeWrappedBody(getModName(name), stmts));
            for (const stmt of stmts) {
              stmt.remove();
            }
          }
        },
      }
    },
  };
};
