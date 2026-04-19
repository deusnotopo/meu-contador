/**
 * confirmAction — substituto tipado e testável para window.confirm()
 * ────────────────────────────────────────────────────────────────────
 * Usa uma Promise que pode ser substituída em testes sem precisar
 * mockar o objeto global window. Em produção, delega para window.confirm
 * enquanto não existe um modal de confirmação customizado.
 *
 * Uso:
 *   const confirmed = await confirmAction("Deseja excluir?");
 *   if (confirmed) { ... }
 *
 * Futuro: trocar a implementação por um modal React sem mudar nenhum callsite.
 */
export async function confirmAction(message: string): Promise<boolean> {
  return Promise.resolve(window.confirm(message));
}
