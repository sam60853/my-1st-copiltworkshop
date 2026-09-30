// 這段程式碼用來管理待辦清單的資料與互動行為。
// 程式會將資料存放在 localStorage 中，讓重新整理後仍然保留原本的待辦事項。

const STORAGE_KEY = 'todo-list-data';

const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const todoCount = document.getElementById('todoCount');
const themeToggle = document.getElementById('themeToggle');
const filterButtons = document.querySelectorAll('.filter-btn');
const THEME_STORAGE_KEY = 'todo-list-theme';
const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

let currentFilter = 'all';
let filterFeedback = '';

// 套用深淺色主題，並更新切換按鈕內容。
function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.dataset.theme = theme;
  themeToggle.innerHTML = isDark
    ? '<span aria-hidden="true">☀️</span><span>淺色模式</span>'
    : '<span aria-hidden="true">🌙</span><span>深色模式</span>';
  themeToggle.setAttribute('aria-pressed', String(isDark));
}

// 優先使用手動選擇，否則依照作業系統偏好設定。
function initializeTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  applyTheme(savedTheme === 'dark' || savedTheme === 'light'
    ? savedTheme
    : colorSchemeQuery.matches ? 'dark' : 'light');
}

initializeTheme();

themeToggle.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  applyTheme(nextTheme);
});

colorSchemeQuery.addEventListener('change', (event) => {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme !== 'dark' && savedTheme !== 'light') {
    applyTheme(event.matches ? 'dark' : 'light');
  }
});

// 讀取 localStorage 中的待辦資料。
// 如果沒有資料，則回傳空陣列。
function loadTodos() {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (!savedData) {
    return [];
  }

  try {
    const parsedData = JSON.parse(savedData);
    return Array.isArray(parsedData) ? parsedData : [];
  } catch (error) {
    console.error('讀取待辦資料失敗：', error);
    return [];
  }
}

let todos = loadTodos();

// 將目前待辦資料存回 localStorage。
function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// 更新底部顯示的未完成數量。
function updateTodoCount() {
  const remainingCount = todos.filter((todo) => !todo.completed).length;
  todoCount.textContent = `未完成: ${remainingCount} 項`;
}

// 依照目前篩選結果顯示合適的空狀態提示。
function updateEmptyState(visibleTodos) {
  if (filterFeedback) {
    emptyState.textContent = filterFeedback;
    emptyState.classList.add('visible');
    return;
  }

  if (visibleTodos.length > 0) {
    emptyState.classList.remove('visible');
    return;
  }

  const emptyMessages = {
    all: '還沒有任何待辦事項,新增一個吧!',
    active: '目前沒有未完成的待辦事項；已完成的項目不會顯示在此篩選中。',
    completed: '目前沒有已完成的待辦事項；取消完成的項目仍在清單中，切換「全部」或「未完成」即可查看。',
  };
  emptyState.textContent = emptyMessages[currentFilter];
  emptyState.classList.add('visible');
}

// 建立一個待辦項目 DOM 節點。
function createTodoItem(todo) {
  const item = document.createElement('li');
  item.className = 'todo-item';
  item.dataset.id = String(todo.id);

  if (todo.completed) {
    item.classList.add('completed');
  }

  const main = document.createElement('label');
  main.className = 'todo-main';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = todo.completed;
  checkbox.dataset.id = String(todo.id);
  checkbox.setAttribute('aria-label', '完成待辦事項');

  const text = document.createElement('span');
  text.className = 'todo-text';
  text.textContent = todo.text;

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'delete-btn';
  deleteBtn.dataset.id = String(todo.id);
  deleteBtn.textContent = '刪除';
  deleteBtn.setAttribute('aria-label', '刪除待辦事項');

  main.appendChild(checkbox);
  main.appendChild(text);
  item.appendChild(main);
  item.appendChild(deleteBtn);

  return item;
}

// 重新繪製整份待辦清單。
function renderTodos() {
  todoList.innerHTML = '';

  const visibleTodos = todos.filter((todo) => {
    if (currentFilter === 'active') return !todo.completed;
    if (currentFilter === 'completed') return todo.completed;
    return true;
  });

  visibleTodos.forEach((todo) => {
    const item = createTodoItem(todo);
    todoList.appendChild(item);
  });

  updateTodoCount();
  updateEmptyState(visibleTodos);
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    filterFeedback = '';
    filterButtons.forEach((filterButton) => {
      const isSelected = filterButton === button;
      filterButton.classList.toggle('active', isSelected);
      filterButton.setAttribute('aria-pressed', String(isSelected));
    });
    renderTodos();
  });
});

// 新增待辦事項。
function addTodo() {
  const text = todoInput.value.trim();

  // 若輸入內容為空白，直接忽略，不新增項目。
  if (!text) {
    todoInput.focus();
    return;
  }

  const newTodo = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text,
    completed: false,
  };

  todos.unshift(newTodo);
  filterFeedback = '';
  saveTodos();
  renderTodos();
  todoInput.value = '';
  todoInput.focus();
}

// 切換待辦完成狀態。
function toggleTodo(id) {
  const changedTodo = todos.find((todo) => todo.id === id);
  filterFeedback = currentFilter === 'completed' && changedTodo && changedTodo.completed
    ? '此項目已取消完成，僅被「已完成」篩選隱藏，並未刪除。切換「全部」即可查看。'
    : '';

  todos = todos.map((todo) => {
    if (todo.id === id) {
      return { ...todo, completed: !todo.completed };
    }
    return todo;
  });

  saveTodos();
  renderTodos();
}

// 刪除指定待辦事項。
function deleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id);
  filterFeedback = '';
  saveTodos();
  renderTodos();
}

// 事件綁定：新增按鈕與 Enter 鍵。
addBtn.addEventListener('click', addTodo);

todoInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    addTodo();
  }
});

// 事件代理：處理勾選完成與刪除按鈕。
todoList.addEventListener('change', (event) => {
  const target = event.target;

  if (target.matches('input[type="checkbox"]')) {
    const item = target.closest('.todo-item');
    if (!item) {
      return;
    }

    toggleTodo(item.dataset.id);
  }
});

todoList.addEventListener('click', (event) => {
  const target = event.target;

  if (target.matches('.delete-btn')) {
    const item = target.closest('.todo-item');
    if (!item) {
      return;
    }

    deleteTodo(item.dataset.id);
  }
});

// 啟動畫面時先渲染既有資料。
renderTodos();
