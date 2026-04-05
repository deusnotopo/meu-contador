import { z } from 'zod';

// Schema para paginação com cursor
export const cursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CursorPagination = z.infer<typeof cursorPaginationSchema>;

// Interface para resposta paginada
export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

// Função helper para criar resposta paginada
export function createPaginatedResponse<T extends { id: string }>(
  items: T[],
  limit: number,
  total?: number
): PaginatedResponse<T> {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, -1) : items;
  const nextCursor = hasMore ? data[data.length - 1]?.id : null;

  return {
    items: data,
    nextCursor,
    hasMore,
    total,
  };
}

// Função helper para criar where clause com cursor
export function createCursorWhere(
  cursor: string | undefined,
  baseWhere: Record<string, any> = {}
): Record<string, any> {
  if (!cursor) {
    return baseWhere;
  }

  return {
    ...baseWhere,
    id: { lt: cursor },
  };
}

// Função helper para paginação offset-based (fallback)
export function createOffsetPagination(
  page: number,
  limit: number
): { skip: number; take: number } {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
}