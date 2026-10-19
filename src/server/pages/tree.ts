export function joinPath(parentPath: string | null, slug: string): string {
  return parentPath ? `${parentPath}/${slug}` : slug;
}

export function isSameOrDescendantPath(path: string, ancestorPath: string): boolean {
  return path === ancestorPath || path.startsWith(`${ancestorPath}/`);
}

type TreeRow = { id: number; parentId: number | null; sort: number };

export type TreeNode<T extends TreeRow> = T & { children: TreeNode<T>[] };

// Узел, чей родитель отсутствует в rows (например, отфильтрован как неопубликованный),
// отбрасывается вместе со всем поддеревом.
export function buildTree<T extends TreeRow>(rows: readonly T[]): TreeNode<T>[] {
  const nodes = new Map<number, TreeNode<T>>();
  for (const row of rows) {
    nodes.set(row.id, { ...row, children: [] });
  }

  const roots: TreeNode<T>[] = [];
  for (const node of nodes.values()) {
    if (node.parentId === null) {
      roots.push(node);
    } else {
      nodes.get(node.parentId)?.children.push(node);
    }
  }

  const sortLevel = (level: TreeNode<T>[]) => {
    level.sort((a, b) => a.sort - b.sort || a.id - b.id);
    for (const node of level) sortLevel(node.children);
  };
  sortLevel(roots);
  return roots;
}

export type FlatNode<T extends TreeRow> = TreeNode<T> & { depth: number };

// Дерево в плоский список в порядке обхода (для выпадающих списков с отступами).
export function flattenTree<T extends TreeRow>(tree: TreeNode<T>[], depth = 0): FlatNode<T>[] {
  return tree.flatMap((node) => [{ ...node, depth }, ...flattenTree(node.children, depth + 1)]);
}

// id узла и всех его потомков.
export function subtreeIds<T extends TreeRow>(node: TreeNode<T>): number[] {
  return [node.id, ...node.children.flatMap(subtreeIds)];
}
