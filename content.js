// 从存储中获取已保存的单词并高亮显示
async function highlightSavedWords() {
  const { words = [] } = await chrome.storage.sync.get('words');
  
  // 创建一个正则表达式来匹配所有保存的单词
  if (words.length === 0) return;
  const wordRegex = new RegExp(`\\b(${words.join('|')})\\b`, 'gi');
  
  // 遍历文本节点并高亮匹配的单词
  function walkText(node) {
    if (node.nodeType === 3) {
      const text = node.textContent;
      if (wordRegex.test(text)) {
        const span = document.createElement('span');
        span.innerHTML = text.replace(wordRegex, '<span class="highlighted-word">$1</span>');
        node.parentNode.replaceChild(span, node);
      }
    } else {
      for (const child of node.childNodes) {
        walkText(child);
      }
    }
  }
  
  walkText(document.body);
}

// 检查是否为英文单词
function isEnglishWord(text) {
  // 只匹配由英文字母组成的单词（可以包含连字符和撇号）
  return /^[a-zA-Z]+(?:[-'][a-zA-Z]+)*$/.test(text);
}

// 添加双击选词功能
document.addEventListener('dblclick', async (e) => {
  const selection = window.getSelection();
  const word = selection.toString().trim().toLowerCase();
  
  // 只有当选中的是英文单词时才进行处理
  if (word && isEnglishWord(word)) {
    const { words = [] } = await chrome.storage.sync.get('words');
    if (!words.includes(word)) {
      words.push(word);
      await chrome.storage.sync.set({ words });
      highlightSavedWords();
    }
  }
});

// 页面加载完成后高亮已保存的单词
highlightSavedWords(); 