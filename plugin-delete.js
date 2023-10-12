module.exports = function() {
  return {
    visitor: {
      UnaryExpression(path) {
        if (path.node.operator === "delete") {
          path.remove();
        }
      },
    },
  };
};