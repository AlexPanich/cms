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
