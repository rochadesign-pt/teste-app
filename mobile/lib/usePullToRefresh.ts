import { useEffect } from "react";
import { Platform } from "react-native";

/**
 * Pull-to-refresh para a web (PWA). O RefreshControl do React Native só
 * funciona em nativo; na web ligamos ouvintes de toque ao nó com scroll.
 *
 * getNode: devolve o elemento DOM com scroll (ex.: FlatList.getScrollableNode()).
 * onRefresh: chamado quando o utilizador puxa para baixo além do limiar.
 * onPull: recebe a distância atual (0..~) para mostrar um indicador.
 */
export function usePullToRefresh(
  getNode: () => any,
  onRefresh: () => void,
  onPull: (distance: number) => void,
) {
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const node = getNode();
    if (!node || typeof node.addEventListener !== "function") return;

    const THRESHOLD = 70;
    let startY = 0;
    let active = false;
    let distance = 0;

    const start = (e: TouchEvent) => {
      if (node.scrollTop <= 0) {
        startY = e.touches[0].clientY;
        active = true;
        distance = 0;
      }
    };
    const move = (e: TouchEvent) => {
      if (!active) return;
      distance = e.touches[0].clientY - startY;
      if (distance > 0 && node.scrollTop <= 0) {
        if (e.cancelable) e.preventDefault(); // trava o "bounce" só ao puxar no topo
        onPull(Math.min(distance, 110));
      } else {
        active = false;
        onPull(0);
      }
    };
    const end = () => {
      if (active && distance > THRESHOLD) onRefresh();
      active = false;
      onPull(0);
    };

    node.addEventListener("touchstart", start, { passive: true });
    node.addEventListener("touchmove", move, { passive: false });
    node.addEventListener("touchend", end, { passive: true });
    return () => {
      node.removeEventListener("touchstart", start);
      node.removeEventListener("touchmove", move);
      node.removeEventListener("touchend", end);
    };
  }, [getNode, onRefresh, onPull]);
}
