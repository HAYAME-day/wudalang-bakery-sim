//全量替换，还没review
// events/recipeBook.js

window.renderRecipeBook = function() {
  let container = document.getElementById('tab-content-recipes');
  if (!container) return;

  container.innerHTML = '';
  
  let header = document.createElement('div');
  header.style.padding = "10px 5px";
  header.style.color = "#8a8a8a";
  header.style.fontSize = "0.9em";
  header.textContent = "点击图标选择今日主打商品：";
  container.appendChild(header);

  let grid = document.createElement('div');
  grid.className = 'recipe-grid'; 
  
  recipes.forEach(r => {
    let item = document.createElement('div');
    item.className = 'recipe-icon-card';
    
    let isSelected = (r.id === selectedRecipeId);
    
    if (r.unlocked) {
      // --- ✅ 已解锁 ---
      if (isSelected) item.classList.add('selected');
      
      item.onclick = () => {
        selectRecipe(r.id);
        renderRecipeBook(); 
      };

      item.innerHTML = `
        <div class="icon-wrapper">
            <img src="${r.img}" class="recipe-img">
            ${isSelected ? '<div class="check-mark">✔</div>' : ''}
        </div>
        <div class="recipe-name">${r.name}</div>
        <div class="recipe-price">${r.price}文</div>
      `;
      item.title = `${r.hint}\n需要: ${getRecipeIngredientsText(r)}`;

    } else {
      // --- 🔒 未解锁 ---
      item.classList.add('locked');
      item.style.cursor = "help"; 
      
      item.innerHTML = `
        <div class="icon-wrapper">
            <span style="font-size:24px;opacity:0.3">🔒</span>
        </div>
        <div class="recipe-name">???</div>
        <div class="recipe-price" style="opacity:0">.</div>
      `;
      
      item.onclick = (e) => {
        // 1. 文字区记录
        pushText(`💡 <b>研发线索</b>：${r.hint}`);
        
        // 2. 气泡提示 (如果没有CSS，这一步看起来就像没反应)
        showHintBubble(e, r.hint);

        item.style.transform = "scale(0.95)";
        setTimeout(() => item.style.transform = "", 100);
      };
      
      item.title = "点击查看研发线索";
    }

    grid.appendChild(item);
  });

  container.appendChild(grid);
}

// --- 辅助函数 ---

function getRecipeIngredientsText(r) {
  let parts = [];
  for(let key in r.recipe) {
    let info = getMaterialInfo(key);
    parts.push(info.name);
  }
  return parts.join('+');
}

// 气泡逻辑
function showHintBubble(e, text) {
    let old = document.querySelector('.hint-bubble');
    if (old) old.remove();

    let bubble = document.createElement('div');
    bubble.className = 'hint-bubble';
    bubble.innerHTML = text;
    
    bubble.style.left = e.clientX + 'px';
    bubble.style.top = (e.clientY - 40) + 'px';

    document.body.appendChild(bubble);

    setTimeout(() => {
        bubble.style.opacity = '0';
        setTimeout(() => bubble.remove(), 300);
    }, 2500); 
}