module.exports = function ({ types: t }) {
  const processNamespaces = ['sjcl'];
  function last(arr) {
    return arr[arr.length - 1];
  }
  function makeVar(id, expr) {
    return t.variableDeclaration('var', [
      t.variableDeclarator(id, expr)
    ]);
  }
  function makeAssign(id, expr) {
    return t.assignmentExpression('=', id, expr);
  }
  function makeNsReq(_ns) {
    const ns = t.identifier(_ns);
    // >>> var sjcl = require('./sjcl');
    return makeVar(
      ns,
      t.callExpression(
        t.identifier('require'), [
        t.stringLiteral(`./${_ns}`),
      ])
    );
  }
  function makeModExport(_ns, _name) {
    const ns = t.identifier(_ns);
    const name = t.identifier(_name);
    const mod = t.memberExpression(ns, name);
    // >>> var cypher = module.exports = sjcl.cypher = sjcl.cypher || {};
    return makeVar(
      name,
      makeAssign(
        t.memberExpression(
          t.identifier('module'),
          t.identifier('exports')
        ),
        makeAssign(
          mod,
          t.logicalExpression(
            '||',
            mod,
            t.objectExpression([])
          )
        )
      )
    );
  }
  function makeModImport(_ns, _name) {
    const ns = t.identifier(_ns);
    const name = t.identifier(_name);
    const mod = t.memberExpression(ns, name);
    // >>> var cypher = sjcl.cypher;
    return makeVar(name, mod);
  }
  function isModMemberAssign(node) {
    // sjcl.codec.arrayBuffer = {};
    //     ^                  ^
    return (
      node.isExpressionStatement() &&
      node.get('expression').isAssignmentExpression() &&
      node.get('expression.left').isMemberExpression() &&
      (
        node.get('expression.left.object').isMemberExpression() ||
        node.get('expression.left.object').isIdentifier()
      )
    );
  }
  function getLeafIdentifier(node) {
    // sjcl.codec.arrayBuffer = {};
    //           ^
    let o = node;
    if (o.isExpressionStatement()) o = o.get('expression');
    if (o.isAssignmentExpression()) o = o.get('left');
    return o;
  }
  function getRootIdentifier(node) {
    // sjcl.codec.arrayBuffer = {};
    //     ^
    let o = getLeafIdentifier(node);
    do {
      o = o.get('object');
    }
    while (o.isMemberExpression());
    return o;
  }
  function getModNsName(node) {
    // sjcl.codec.arrayBuffer = {};
    // ^^^^
    const root = getRootIdentifier(node);
    return root.node?.name;
  }
  function getModName(node) {
    // sjcl.codec.arrayBuffer = {};
    //      ^^^^^
    const root = getRootIdentifier(node);
    return root.parentPath.get('property').node.name;
  }
  function getModMember(node) {
    // sjcl.codec.arrayBuffer = {};
    //            ^^^^^^^^^^^
    const root = getRootIdentifier(node);
    const leaf = getLeafIdentifier(node);
    return root.parentPath != leaf ? leaf.get('property').node.name : null;
  }
  function hasModMemberAssign(nodes) {
    const nds = nodes.filter(isModMemberAssign);
    return nds.length > 0 && nds[0];
  }
  function isExportsExpression(node) {
    // module.exports = forge.des = forge.des || {};
    // ^^^^^^^^^^^^^^^^^^
    return (
      node.isAssignmentExpression() &&
      node.get('left').isMemberExpression() &&
      node.get('left.object').node.name === 'module' &&
      node.get('left.property').node.name === 'exports' &&
      node.get('right').isAssignmentExpression()
    );
  }
  function isExports(ns, node) {
    // module.exports = forge.des = forge.des || {};
    // ^^^^^^^^^^^^^^^^^^^^^^
    return (
      node.isExpressionStatement() &&
      isExportsExpression(node.get('expression')) &&
      node.get('expression.right.left.object').node.name === ns
    );
  }
  function hasExports(nodes, ns) {
    const nds = nodes.filter(isExports.bind(null, ns));
    return nds.length > 0 && nds[0];
  }
  function isVarExports(ns, node) {
    // var des = module.exports = forge.des = forge.des || {};
    // ^^^     ^^^^^^^^^^^^^^^^^^^^^^^^
    return (
      node.isVariableDeclaration() &&
      node.get('declarations.0').isVariableDeclarator() &&
      node.get('declarations.0.id').isIdentifier() &&
      isExportsExpression(node.get('declarations.0.init')) &&
      node.get('declarations.0.init.right.left.object').node.name === ns
    );
  }
  function hasVarExports(nodes, ns) {
    const nds = nodes.filter(isVarExports.bind(null, ns));
    return nds.length > 0 && nds[0];
  }
  function isNsReq(ns, name, node) {
    // var forge = require('./forge');
    // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    return (
      node.isVariableDeclaration() &&
      node.get('declarations.0').isVariableDeclarator() &&
      node.get('declarations.0.id').isIdentifier() &&
      node.get('declarations.0.id').node.name === ns &&
      node.get('declarations.0.init').isCallExpression() &&
      node.get('declarations.0.init.callee').node.name === 'require' &&
      node.get('declarations.0.init.arguments.0').isStringLiteral() &&
      node.get('declarations.0.init.arguments.0.value').node === name
    );
  }
  function hasNsReq(nodes, ns) {
    const nds = nodes.filter(isNsReq.bind(null, ns, `./${ns}`));
    return nds.length > 0 && nds[0];
  }
  function getRootStatement(node) {
    let o = node;
    let root = null;
    do {
      root = o;
      o = o.parentPath;
    } while (o && !(o.isExpressionStatement() || o.isProgram()));
    return root;
  }
  return {
    visitor: {
      Program: {
        exit(path) {
          const stmts = path.get('body');
          if (!stmts.length) {
            return;
          }
          const name = hasModMemberAssign(stmts);
          const ns = name && getModNsName(name);
          const mod = name && getModName(name);
          if (name && processNamespaces.includes(ns)) {
            const exports = hasExports(stmts, ns) || hasVarExports(stmts, ns);
            if (exports) {
              return;
            }

            const needsNsReq = !hasNsReq(stmts, ns);
            let prelude = [
              ...(needsNsReq ? [makeNsReq(ns)] : []),
              makeModExport(ns, mod),
            ];

            if (exports) {
              prelude = exports.replaceWithMultiple(prelude);
            } else {
              prelude = stmts[0].insertBefore(prelude);
            }

            const ignores = [...prelude];

            for (const stmt of stmts) {
              if (
                isModMemberAssign(stmt) &&
                getModNsName(stmt) == ns &&
                getModName(stmt) == mod
              ) {
                if (getModMember(stmt)) {
                  getRootIdentifier(stmt).parentPath
                    .replaceWith(t.identifier(mod));
                }
                ignores.push(stmt);
              } else if (
                isModMemberAssign(stmt) &&
                getModNsName(stmt) == ns &&
                getModName(stmt) != mod
              ) {
                ignores.push(stmt);
              }
            }

            const mods = [mod];
            const paths = [];
            path.traverse({
              enter(path) {
                paths.push(path);
              },
              exit(path) {
                paths.pop();
              },
              MemberExpression(path) {
                const root = getRootStatement(path);
                if (
                  ignores.some(i =>
                    i === path ||
                    i === root ||
                    i === root.parentPath) ||
                  getModNsName(path) != ns
                ) {
                  path.skip();
                  paths.pop();
                  return;
                }

                const imod = getModName(path);
                if (!mods.includes(imod)) {
                  const imp = last(prelude).insertAfter(makeModImport(ns, imod));
                  prelude.push(...imp);
                  ignores.push(...imp);
                  mods.push(imod);
                }

                getRootIdentifier(path).parentPath
                  .replaceWith(t.identifier(imod));

              },
            });
          }
        },
      }
    },
  };
};
