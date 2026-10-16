// Shared first-party menu host. No destination document is inspected here.
// Portals remain inside the topmost modal to avoid modal inertness. Manual
// popovers supply elevation without native light-dismiss racing contextmenu.
export function createMenuHost(
  { onError = (error) => console.error("Menu action failed", error) } = {},
) {
  let session = null;
  let submenu = null;
  let suppressClickUntil = 0;
  const panels = new Set();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (n, low, high) => Math.max(low, Math.min(n, Math.max(low, high)));
  const entries = (panel) => [...panel.children].filter((n) => n.matches("button:not(:disabled)"));
  function mode() {
    if (document.body.dataset.motion === "off" || document.body.classList.contains("performance")) {
      return "off";
    }
    return reduced.matches || document.body.dataset.motion === "subtle" ? "subtle" : "full";
  }
  function focus(node) {
    node?.focus({ preventScroll: true });
  }
  function dispose(panel) {
    clearTimeout(panel.exitTimer);
    panel.remove();
    panels.delete(panel);
  }
  function retire(panel, instant = false) {
    panel.style.pointerEvents = "none";
    panel.classList.remove("menu-open");
    if (instant || mode() === "off") dispose(panel);
    else panel.exitTimer = setTimeout(() => dispose(panel), 125);
  }
  function closeSub() {
    if (!submenu) return;
    submenu.parent.setAttribute("aria-expanded", "false");
    dispose(submenu.panel);
    submenu = null;
  }
  function close(instant = false, restore = true) {
    if (!session) return;
    const previous = session;
    session = null;
    closeSub();
    retire(previous.panel, instant);
    previous.onClose?.();
    if (restore && previous.invoker?.isConnected && !previous.invoker.disabled) {
      focus(previous.invoker);
    }
  }
  function position(panel, x, y, origin = "left top") {
    panel.hidden = false;
    panel.style.maxWidth = `${Math.max(120, innerWidth - 16)}px`;
    panel.style.maxHeight = `${Math.max(40, innerHeight - 16)}px`;
    if (panel.showPopover) panel.showPopover();
    const w = panel.offsetWidth, h = panel.offsetHeight;
    panel.style.left = `${clamp(x, 8, innerWidth - w - 8)}px`;
    panel.style.top = `${clamp(y, 8, innerHeight - h - 8)}px`;
    panel.style.transformOrigin = origin;
    panel.dataset.menuMotion = mode();
    // Establish the closed state before retargeting. No animation on keyboard.
    void panel.offsetWidth;
    panel.classList.add("menu-open");
  }
  function makePanel(items, isSub = false) {
    const panel = document.createElement("div");
    panel.className = "context-menu2" + (isSub ? " submenu" : "");
    panel.setAttribute("role", "menu");
    panel.setAttribute("aria-label", isSub ? "More actions" : "Actions");
    panel.tabIndex = -1;
    panel.hidden = true;
    if ("popover" in panel) panel.popover = "manual";
    const modal = [...document.querySelectorAll("dialog:modal")].pop();
    (modal || document.fullscreenElement || document.body).append(panel);
    panels.add(panel);
    for (const item of items) {
      if (item.separator) {
        const rule = document.createElement("div");
        rule.className = "menu-separator";
        rule.setAttribute("role", "separator");
        panel.append(rule);
        continue;
      }
      const node = document.createElement("button");
      node.type = "button";
      node.tabIndex = -1;
      node.className = "menu-item" + (item.danger ? " danger" : "");
      node.dataset.action = item.id || "";
      node.setAttribute("role", item.checked === undefined ? "menuitem" : "menuitemcheckbox");
      node.setAttribute("aria-disabled", String(!!item.disabled));
      if (item.checked !== undefined) node.setAttribute("aria-checked", String(item.checked));
      node.disabled = !!item.disabled;
      if (item.disabled && item.reason) node.title = item.reason;
      const icon = document.createElement("span");
      icon.className = "menu-icon";
      icon.setAttribute("aria-hidden", "true");
      if (item.checked !== undefined) {
        icon.className += " menu-check" + (item.checked ? " on" : "");
      } else if (item.icon) {
        icon.innerHTML = `<svg aria-hidden="true"><use href="#i-${item.icon}"/></svg>`;
      }
      node.append(icon);
      const label = document.createElement("span");
      label.className = "menu-label";
      label.textContent = item.label;
      node.append(label);
      if (item.submenu?.length && !isSub) {
        node.setAttribute("aria-haspopup", "menu");
        node.setAttribute("aria-expanded", "false");
        const arrow = document.createElement("span");
        arrow.className = "menu-more";
        arrow.innerHTML =
          '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 5 7 7-7 7"/></svg>';
        arrow.setAttribute("aria-hidden", "true");
        node.append(arrow);
        node.openSub = (keyboard = false) => {
          if (submenu?.parent !== node) {
            closeSub();
            const child = makePanel(item.submenu, true);
            const rect = node.getBoundingClientRect();
            const flip = rect.right + 220 > innerWidth - 8;
            position(
              child,
              flip ? rect.left - 220 : rect.right + 2,
              rect.top,
              flip ? "right top" : "left top",
            );
            submenu = { panel: child, parent: node };
            node.setAttribute("aria-expanded", "true");
          }
          if (keyboard) focus(entries(submenu.panel)[0] || submenu.panel);
        };
        node.addEventListener("click", () => node.openSub(true));
        node.addEventListener("pointerenter", (event) => {
          if (event.pointerType === "mouse" && matchMedia("(hover: hover)").matches) node.openSub();
        });
      } else {
        node.addEventListener("pointerenter", () => {
          if (!isSub) closeSub();
        });
        node.addEventListener("click", () => {
          close(true);
          Promise.resolve().then(() => item.action?.()).catch((error) => {
            onError(error);
          });
        });
      }
      panel.append(node);
    }
    return panel;
  }
  function open(items, { at, anchor, align, onClose, focusFirst = false } = {}) {
    close(true, false);
    for (const panel of panels) dispose(panel);
    if (!items.length) return;
    const invoker = anchor?.matches("button, input, [tabindex]") ? anchor : document.activeElement;
    const panel = makePanel(items);
    session = { panel, invoker, onClose };
    let x = at?.x ?? 8, y = at?.y ?? 8;
    if (!at && anchor) {
      const rect = anchor.getBoundingClientRect();
      x = align === "end" ? rect.right - 220 : rect.left;
      y = rect.bottom + 4;
    }
    if (focusFirst) panel.dataset.menuMotion = "off";
    position(panel, x, y);
    if (focusFirst) {
      panel.style.transition = "none";
      focus(entries(panel)[0] || panel);
    } else focus(panel);
  }
  window.addEventListener("keydown", (event) => {
    if (!session) return;
    if (event.key === "Tab") {
      close(true);
      return;
    }
    const panel = submenu?.panel.contains(document.activeElement) ? submenu.panel : session.panel;
    const nodes = entries(panel), index = nodes.indexOf(document.activeElement);
    if (
      !["ArrowDown", "ArrowUp", "Home", "End", "Escape", "ArrowRight", "ArrowLeft"].includes(
        event.key,
      )
    ) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.key === "Escape" || event.key === "ArrowLeft") {
      if (submenu) {
        const parent = submenu.parent;
        closeSub();
        focus(parent);
      } else if (event.key === "Escape") close();
    } else if (event.key === "ArrowRight") document.activeElement?.openSub?.(true);
    else if (nodes.length) {
      const next = event.key === "Home"
        ? 0
        : event.key === "End"
        ? nodes.length - 1
        : (index + (event.key === "ArrowUp" ? -1 : 1) + nodes.length) % nodes.length;
      focus(nodes[next]);
    }
  }, true);
  document.addEventListener("pointerdown", (event) => {
    if (session && ![...panels].some((panel) => panel.contains(event.target))) close(true, false);
  }, true);
  document.addEventListener("scroll", (event) => {
    if (session && ![...panels].some((panel) => panel.contains(event.target))) close(true);
  }, true);
  window.addEventListener("resize", () => close(true));
  window.addEventListener("blur", () => close(true, false));
  document.addEventListener("close", () => close(true, false), true);
  document.addEventListener("click", (event) => suppressAfterLongPress(event), true);
  function suppressAfterLongPress(event) {
    if (Date.now() >= suppressClickUntil || [...panels].some((p) => p.contains(event.target))) {
      return false;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    return true;
  }
  function bindLongPress(element, callback) {
    let timer, x, y;
    const cancel = () => clearTimeout(timer);
    element.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" || event.target.closest("input,textarea,select")) return;
      cancel();
      x = event.clientX;
      y = event.clientY;
      timer = setTimeout(() => {
        suppressClickUntil = Date.now() + 1000;
        callback(event);
      }, 500);
    });
    element.addEventListener("pointermove", (event) => {
      if (Math.hypot(event.clientX - x, event.clientY - y) > 10) cancel();
    });
    for (const name of ["pointerup", "pointerleave", "pointercancel", "dragstart"]) {
      element.addEventListener(name, cancel);
    }
  }
  return { open, close, bindLongPress, suppressAfterLongPress, isOpen: () => !!session };
}
