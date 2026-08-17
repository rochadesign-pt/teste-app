/**
 * Fundo atmosférico. No tema claro a app é lisa/limpa, por isso o Aura é
 * um no-op. Mantido como componente para não partir os ecrãs que ainda o
 * importam; quando quisermos um wash subtil, volta-se a preenchê-lo aqui.
 */
export function Aura(_props?: {
  height?: number;
  a?: string;
  b?: string;
  wash?: string;
}) {
  return null;
}
