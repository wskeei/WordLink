document.addEventListener('DOMContentLoaded', async () => {
  // 从 Chrome 存储中获取已保存的单词
  const { words = [] } = await chrome.storage.sync.get('words');
  const wordList = document.getElementById('wordList');
  
  // 显示所有保存的单词
  words.forEach(word => {
    const wordItem = document.createElement('div');
    wordItem.className = 'word-item';
    
    const wordText = document.createElement('span');
    wordText.textContent = word;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete';
    deleteBtn.textContent = '删除';
    deleteBtn.onclick = async () => {
      const { words: currentWords } = await chrome.storage.sync.get('words');
      const newWords = currentWords.filter(w => w !== word);
      await chrome.storage.sync.set({ words: newWords });
      wordItem.remove();
    };
    
    wordItem.appendChild(wordText);
    wordItem.appendChild(deleteBtn);
    wordList.appendChild(wordItem);
  });
}); 