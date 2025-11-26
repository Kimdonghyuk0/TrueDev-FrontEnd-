let loaderPromise = null;

function getEditorConstructor() {
  return window?.toastui?.Editor;
}

function getSyntaxPlugin() {
  return window?.toastui?.Editor?.plugin?.codeSyntaxHighlight;
}

async function ensureEditor() {
  if (getEditorConstructor()) return true;
  if (!loaderPromise) {
    loaderPromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@toast-ui/editor@3.2.2/dist/toastui-editor-all.min.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);

      const plugin = document.createElement('script');
      plugin.src =
        'https://cdn.jsdelivr.net/npm/@toast-ui/editor-plugin-code-syntax-highlight@3.2.2/dist/toastui-editor-plugin-code-syntax-highlight.min.js';
      document.head.appendChild(plugin);
    });
  }
  return loaderPromise;
}

export async function mountRichEditor(target, { initialValue = '', placeholder = '무엇을 공유하고 싶으신가요?' } = {}) {
  if (!target) return null;
  const ready = await ensureEditor();
  const Editor = ready ? getEditorConstructor() : null;
  if (!Editor) return null;

  const toolbarItems = [
    ['undo', 'redo'],
    ['bold', 'italic', 'strike'],
    ['hr', 'quote'],
    ['ul', 'ol', 'task'],
    ['table', 'link'],
    ['code', 'codeblock']
  ];
  const plugins = [];
  const syntaxPlugin = getSyntaxPlugin();
  if (syntaxPlugin) plugins.push(syntaxPlugin);

  return new Editor({
    el: target,
    height: '520px',
    initialEditType: 'markdown',
    previewStyle: 'vertical',
    toolbarItems,
    placeholder,
    initialValue,
    usageStatistics: false,
    autofocus: false,
    plugins
  });
}

export async function renderMarkdown(target, value = '') {
  if (!target) return;
  // AI 메시지처럼 백틱/JSON이 섞여 들어오는 경우를 위해 텍스트만 출력할 fallback
  const plain = typeof value === 'string' ? value : '';
  const ready = await ensureEditor();
  const Editor = ready ? getEditorConstructor() : null;
  if (!Editor || typeof Editor.factory !== 'function') {
    target.textContent = plain;
    return;
  }
  target.innerHTML = '';
  const plugins = [];
  const syntaxPlugin = getSyntaxPlugin();
  if (syntaxPlugin) plugins.push(syntaxPlugin);
  try {
    Editor.factory({
      el: target,
      viewer: true,
      initialValue: plain || '',
      usageStatistics: false,
      plugins
    });
  } catch (err) {
    target.textContent = plain;
  }
}
